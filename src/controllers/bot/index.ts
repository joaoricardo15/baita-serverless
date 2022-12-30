'use strict'

import { S3 } from '@aws-sdk/client-s3'
import { Lambda } from '@aws-sdk/client-lambda'
import { Scheduler } from '@aws-sdk/client-scheduler'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { ApiGatewayV2 } from '@aws-sdk/client-apigatewayv2'
import { IBot, ITask, ITaskResult, TaskStatus } from 'src/models/bot'
import { InputSource, ServiceName } from 'src/models/service'
import { v4 as uuidv4 } from 'uuid'
import { Code } from '../../utils/code'

const USERS_TABLE = process.env.USERS_TABLE || ''
const BOTS_BUCKET = process.env.BOTS_BUCKET || ''
const BOTS_PERMISSION = process.env.BOTS_PERMISSION || ''
const SERVICE_PREFIX = process.env.SERVICE_PREFIX || ''

export class Bot {
  async getBot(userId: string, botId: string) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      const result = await ddb.get({
        TableName: USERS_TABLE,
        Key: { userId, sortKey: `#BOT#${botId}` },
      })

      return result.Item
    } catch (err) {
      throw err.message
    }
  }

  async getBots(userId: string) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      const result = await ddb.query({
        TableName: USERS_TABLE,
        KeyConditionExpression:
          'userId = :userId and begins_with(sortKey, :sortKey)',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':sortKey': '#BOT',
        },
      })

      return result.Items
    } catch (err) {
      throw err.message
    }
  }

  async createBot(userId: string) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))
    const apigateway = new ApiGatewayV2({})
    const scheduler = new Scheduler({})
    const lambda = new Lambda({})
    const s3 = new S3({})
    const code = new Code()

    try {
      const botId = uuidv4()

      const sampleCode = code.getSampleCode(userId, botId)
      const codeFile = await code.getCodeFile(sampleCode)

      await s3.putObject({
        Bucket: BOTS_BUCKET,
        Key: `${botId}.zip`,
        Body: codeFile,
      })

      const lambdaResult = await lambda.createFunction({
        FunctionName: `${SERVICE_PREFIX}-${botId}`,
        Handler: 'index.handler',
        Runtime: 'nodejs12.x',
        Role: BOTS_PERMISSION,
        Code: {
          S3Bucket: BOTS_BUCKET,
          S3Key: `${botId}.zip`,
        },
      })

      const botUrl = '/bot'

      const apiResult = await apigateway.createApi({
        Name: `${SERVICE_PREFIX}-${botId}`,
        ProtocolType: 'HTTP',
        CredentialsArn: BOTS_PERMISSION,
        RouteKey: `ANY ${botUrl}`,
        Target: lambdaResult.FunctionArn,
        CorsConfiguration: {
          AllowHeaders: ['*'],
          AllowOrigins: ['*'],
          AllowMethods: ['*'],
        },
      })

      await scheduler.createSchedule({
        Name: `${SERVICE_PREFIX}-${botId}`,
        State: 'DISABLED',
        ScheduleExpression: 'cron(0 0 1 * ? 2030)',
        FlexibleTimeWindow: {
          Mode: 'OFF',
        },
        Target: {
          Arn: lambdaResult.FunctionArn || '',
          RoleArn: BOTS_PERMISSION,
        },
      })

      const bot: IBot = {
        botId,
        userId,
        name: '',
        active: false,
        apiId: apiResult.ApiId || '',
        triggerUrl: `${apiResult.ApiEndpoint}${botUrl}`,
        triggerSamples: [],
        tasks: [
          {
            taskId: Date.now(),
            inputData: [],
          },
        ],
      }

      await ddb.put({
        TableName: USERS_TABLE,
        Item: {
          ...bot,
          sortKey: `#BOT#${bot.botId}`,
        },
      })

      return bot
    } catch (err) {
      throw err.message
    }
  }

  async deleteBot(userId: string, botId: string, apiId: string) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))
    const scheduler = new Scheduler({})
    const apigateway = new ApiGatewayV2({})
    const lambda = new Lambda({})
    const s3 = new S3({})

    try {
      await ddb.delete({
        TableName: USERS_TABLE,
        Key: { userId, sortKey: `#BOT#${botId}` },
      })

      await apigateway.deleteApi({ ApiId: apiId })

      await scheduler.deleteSchedule({
        Name: `${SERVICE_PREFIX}-${botId}`,
      })

      await lambda.deleteFunction({
        FunctionName: `${SERVICE_PREFIX}-${botId}`,
      })

      await s3.deleteObject({ Bucket: BOTS_BUCKET, Key: `${botId}.zip` })
    } catch (err) {
      throw err.message
    }
  }

  async updateBot(
    userId: string,
    botId: string,
    name: string,
    active: boolean,
    tasks: ITask[]
  ) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      const result = await ddb.update({
        TableName: USERS_TABLE,
        Key: { userId, sortKey: `#BOT#${botId}` },
        UpdateExpression: 'set #name = :name, tasks = :tasks, active = :active',
        ExpressionAttributeNames: {
          '#name': 'name', // Expression used here bacause 'name' is a reserved word
        },
        ExpressionAttributeValues: {
          ':name': name,
          ':tasks': tasks,
          ':active': active,
        },
        ReturnValues: 'ALL_NEW',
      })

      return result.Attributes
    } catch (err) {
      throw err.message
    }
  }

  async deployBot(
    userId: string,
    botId: string,
    name: string,
    active: boolean,
    tasks: ITask[]
  ) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))
    const scheduler = new Scheduler({})
    const lambda = new Lambda({})
    const s3 = new S3({})
    const code = new Code()

    try {
      const botCode = code.mountBotCode(userId, botId, active, tasks)
      const codeFile = await code.getCodeFile(botCode)

      await s3.putObject({
        Bucket: BOTS_BUCKET,
        Key: `${botId}.zip`,
        Body: codeFile,
      })

      const lambdaResult = await lambda.updateFunctionCode({
        FunctionName: `${SERVICE_PREFIX}-${botId}`,
        S3Bucket: BOTS_BUCKET,
        S3Key: `${botId}.zip`,
      })

      if (
        active &&
        tasks[0].service?.name === ServiceName.schedule &&
        tasks[0].inputData.find((input) => input.name === 'expression')?.value
      ) {
        await scheduler.updateSchedule({
          Name: `${SERVICE_PREFIX}-${botId}`,
          State: 'ENABLED',
          ScheduleExpression: tasks[0].inputData.find(
            (input) => input.name === 'expression'
          )?.value as string,
          FlexibleTimeWindow: {
            Mode: 'OFF',
          },
          Target: {
            Arn: lambdaResult.FunctionArn || '',
            RoleArn: BOTS_PERMISSION,
          },
        })
      } else {
        await scheduler.updateSchedule({
          Name: `${SERVICE_PREFIX}-${botId}`,
          State: 'DISABLED',
          ScheduleExpression: 'cron(0 0 1 * ? 2030)',
          FlexibleTimeWindow: {
            Mode: 'OFF',
          },
          Target: {
            Arn: lambdaResult.FunctionArn || '',
            RoleArn: BOTS_PERMISSION,
          },
        })
      }

      const dbResult = await ddb.update({
        TableName: USERS_TABLE,
        Key: { userId, sortKey: `#BOT#${botId}` },
        UpdateExpression: 'set #name = :name, tasks = :tasks, active = :active',
        ExpressionAttributeNames: {
          '#name': 'name', // Expression used here bacause 'name' is a reserved word
        },
        ExpressionAttributeValues: {
          ':name': name,
          ':tasks': tasks,
          ':active': active,
        },
        ReturnValues: 'ALL_NEW',
      })

      return dbResult.Attributes
    } catch (err) {
      throw err.message
    }
  }

  getTestInput(task: ITask) {
    const input = {}

    if (
      task.service?.config.inputFields &&
      task.service.config.inputSource === InputSource.service
    )
      for (let j = 0; j < task.service.config.inputFields.length; j++) {
        const name = task.service.config.inputFields[j].name
        const inputField = task.inputData.find((x) => x.name === name)
        if (!inputField) throw 'Invalid bot config'
        input[inputField.name] = inputField.sampleValue
      }
    else if (task.service?.config.inputSource === InputSource.input)
      for (let j = 0; j < task.inputData.length; j++) {
        const inputField = task.inputData[j]
        input[inputField.name] = inputField.sampleValue
      }

    return input
  }

  async testBot(userId: string, botId: string, task: ITask, taskIndex: number) {
    const lambda = new Lambda({})
    const ddb = DynamoDBDocument.from(new DynamoDB({}), {
      marshallOptions: { removeUndefinedValues: true },
    })

    try {
      const inputData = this.getTestInput(task)

      const testLambdaResult = await lambda.invoke({
        FunctionName: `${SERVICE_PREFIX}-${task.service?.name}`,
        Payload: JSON.stringify({
          userId,
          connectionId: task.connectionId,
          appConfig: task.app?.config,
          serviceConfig: task.service?.config,
          inputData,
        }) as unknown as Uint8Array,
      })

      const testLambdaPayload = JSON.parse(
        new TextDecoder().decode(testLambdaResult.Payload)
      )

      const sample = {
        inputData,
        outputData: testLambdaPayload.data,
        status: testLambdaPayload.success
          ? TaskStatus.success
          : TaskStatus.fail,
        timestamp: Date.now(),
      }

      await ddb.update({
        TableName: USERS_TABLE,
        Key: { userId, sortKey: `#BOT#${botId}` },
        ReturnValues: 'ALL_NEW',
        UpdateExpression: `set tasks[${taskIndex}].sampleResult = :sample`,
        ExpressionAttributeValues: {
          ':sample': sample,
        },
      })

      return sample
    } catch (err) {
      throw err.message
    }
  }

  async addTriggerSample(userId: string, botId: string, sample: ITaskResult) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}), {
      marshallOptions: { removeUndefinedValues: true },
    })

    try {
      await ddb.update({
        TableName: USERS_TABLE,
        Key: { userId, sortKey: `#BOT#${botId}` },
        ReturnValues: 'ALL_NEW',
        UpdateExpression: `set tasks[0].sampleResult = :sample,
          triggerSamples = list_append(if_not_exists(triggerSamples, :emptyList), :sampleList)`,
        ExpressionAttributeValues: {
          ':sample': sample,
          ':sampleList': [sample],
          ':emptyList': [],
        },
      })
    } catch (err) {
      throw err.message
    }
  }

  async addConnection(
    userId: string,
    botId: string,
    connectionId: string,
    taskIndex: number
  ) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      await ddb.update({
        TableName: USERS_TABLE,
        Key: { userId, sortKey: `#BOT#${botId}` },
        UpdateExpression: `set tasks[${taskIndex}].connectionId = :connectionId`,
        ExpressionAttributeValues: {
          ':connectionId': connectionId,
        },
        ReturnValues: 'ALL_NEW',
      })
    } catch (err) {
      throw err.message
    }
  }
}
