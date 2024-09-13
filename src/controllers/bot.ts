'use strict'

import { S3 } from '@aws-sdk/client-s3'
import { Lambda } from '@aws-sdk/client-lambda'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { Scheduler } from '@aws-sdk/client-scheduler'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { ApiGatewayV2 } from '@aws-sdk/client-apigatewayv2'
import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs'
import { v4 as uuidv4 } from 'uuid'
import {
  IBot,
  IBotModel,
  ITask,
  ITaskExecutionResult,
  TaskExecutionStatus,
} from 'src/models/bot/interface'
import { validateTaskResult } from 'src/models/bot/schema'
import {
  getCodeFile,
  getBotSampleCode,
  getCompleteBotCode,
} from 'src/utils/code'
import { ServiceName } from 'src/models/service/interface'
import { getInputDataFromService } from 'src/utils/bot'

const CORE_TABLE = process.env.CORE_TABLE || ''
const BOTS_BUCKET = process.env.BOTS_BUCKET || ''
const BOTS_PERMISSION = process.env.BOTS_PERMISSION || ''
const SERVICE_PREFIX = process.env.SERVICE_PREFIX || ''

export class Bot {
  async getBot(userId: string, botId: string) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      const result = await ddb.get({
        TableName: CORE_TABLE,
        Key: { userId, sortKey: `#BOT#${botId}` },
      })

      return result.Item as IBot
    } catch (err) {
      throw err.message
    }
  }

  async getBots(userId: string) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      const result = await ddb.query({
        TableName: CORE_TABLE,
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

  async getBotLogs(botId: string, searchTerms: string | string[] | undefined) {
    const cloudWatchLogs = new CloudWatchLogs({})

    try {
      const botPrefix = `${SERVICE_PREFIX}-${botId}`

      let queryString =
        'fields @message | sort @timestamp desc | filter @message like "\tINFO\t"'

      if (searchTerms) {
        if (Array.isArray(searchTerms))
          searchTerms.forEach(
            (term) => (queryString += ` | filter @message like /(?i)${term}/`)
          )
        else queryString += ` | filter @message like /(?i)${searchTerms}/`
      }

      let startResponse
      try {
        startResponse = await cloudWatchLogs.startQuery({
          limit: 20,
          queryString,
          endTime: Date.now(),
          startTime: Date.now() - 10 * 24 * 60 * 60 * 1000, // last 10 days
          logGroupName: `/aws/lambda/${botPrefix}`,
        })
      } catch (err) {
        return []
      }

      let queryResponse
      while (!queryResponse || queryResponse.status !== 'Complete') {
        await new Promise((resolve) => setTimeout(resolve, 100))

        queryResponse = await cloudWatchLogs.getQueryResults({
          queryId: startResponse.queryId,
        })
      }

      return queryResponse?.results?.map((result) =>
        JSON.parse(
          result
            .find((obj) => obj.field === '@message')
            .value.split('\tINFO\t')[1]
        )
      )
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

    try {
      const botId = uuidv4()
      const botPrefix = `${SERVICE_PREFIX}-${botId}`

      const sampleCode = getBotSampleCode(userId, botId)
      const codeFile = await getCodeFile(sampleCode)

      await s3.putObject({
        Bucket: BOTS_BUCKET,
        Key: `${botPrefix}.zip`,
        Body: codeFile,
      })

      const lambdaResult = await lambda.createFunction({
        FunctionName: botPrefix,
        Handler: 'index.handler',
        Runtime: 'nodejs12.x',
        Timeout: 300,
        Role: BOTS_PERMISSION,
        Code: {
          S3Bucket: BOTS_BUCKET,
          S3Key: `${botPrefix}.zip`,
        },
      })

      const botUrl = '/bot'

      const apiResult = await apigateway.createApi({
        Name: botPrefix,
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
        Name: botPrefix,
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
        description: '',
        image: '',
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
        TableName: CORE_TABLE,
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

  async deployBotModel(userId: string, model: IBotModel) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))
    const apigateway = new ApiGatewayV2({})
    const scheduler = new Scheduler({})
    const lambda = new Lambda({})
    const s3 = new S3({})

    try {
      const botId = uuidv4()
      const botPrefix = `${SERVICE_PREFIX}-${botId}`

      const sampleCode = getCompleteBotCode(userId, botId, model.tasks)
      const codeFile = await getCodeFile(sampleCode)

      await s3.putObject({
        Bucket: BOTS_BUCKET,
        Key: `${botPrefix}.zip`,
        Body: codeFile,
      })

      const lambdaResult = await lambda.createFunction({
        FunctionName: botPrefix,
        Handler: 'index.handler',
        Runtime: 'nodejs12.x',
        Timeout: 300,
        Role: BOTS_PERMISSION,
        Code: {
          S3Bucket: BOTS_BUCKET,
          S3Key: `${botPrefix}.zip`,
        },
      })

      const botUrl = '/bot'

      const apiResult = await apigateway.createApi({
        Name: botPrefix,
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
        Name: botPrefix,
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

      if (model.tasks[0].service?.name === ServiceName.schedule) {
        await scheduler.updateSchedule({
          Name: botPrefix,
          State: 'ENABLED',
          ScheduleExpression: model.tasks[0].inputData.find(
            (input) => input.name === 'expression'
          )?.value as string,
          ScheduleExpressionTimezone: model.tasks[0].inputData.find(
            (input) => input.name === 'timeZone'
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
          Name: botPrefix,
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

      const bot: IBot = {
        botId,
        userId,
        active: true,
        apiId: apiResult.ApiId || '',
        triggerUrl: `${apiResult.ApiEndpoint}${botUrl}`,
        triggerSamples: [],

        name: model.name,
        image: model.image,
        tasks: model.tasks,
        modelId: model.modelId,
        description: model.description,
      }

      await ddb.put({
        TableName: CORE_TABLE,
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
    const cloudWatchLogs = new CloudWatchLogs({})
    const apigateway = new ApiGatewayV2({})
    const scheduler = new Scheduler({})
    const lambda = new Lambda({})
    const s3 = new S3({})

    try {
      const botPrefix = `${SERVICE_PREFIX}-${botId}`

      await ddb.delete({
        TableName: CORE_TABLE,
        Key: { userId, sortKey: `#BOT#${botId}` },
      })

      await apigateway.deleteApi({ ApiId: apiId })

      await scheduler.deleteSchedule({
        Name: botPrefix,
      })

      await lambda.deleteFunction({
        FunctionName: botPrefix,
      })

      // Sometimes the log group does not exists yet
      try {
        await cloudWatchLogs.deleteLogGroup({
          logGroupName: `/aws/lambda/${botPrefix}`,
        })
      } catch (err) {
        console.log(err.message)
      }

      await s3.deleteObject({ Bucket: BOTS_BUCKET, Key: `${botPrefix}.zip` })
    } catch (err) {
      throw err.message
    }
  }

  async updateBot(
    userId: string,
    botId: string,
    name: string,
    image: string,
    description: string,
    active: boolean,
    tasks: ITask[]
  ) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}), {
      marshallOptions: { removeUndefinedValues: true },
    })

    try {
      const result = await ddb.update({
        TableName: CORE_TABLE,
        Key: { userId, sortKey: `#BOT#${botId}` },
        UpdateExpression:
          'set #name = :name, image = :image, description = :description, tasks = :tasks, active = :active',
        ExpressionAttributeNames: {
          '#name': 'name', // Expression used here bacause 'name' is a reserved word
        },
        ExpressionAttributeValues: {
          ':name': name,
          ':image': image || '',
          ':description': description || '',
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

    try {
      const botPrefix = `${SERVICE_PREFIX}-${botId}`

      const botCode = !active
        ? getBotSampleCode(userId, botId)
        : getCompleteBotCode(userId, botId, tasks)
      const codeFile = await getCodeFile(botCode)

      await s3.putObject({
        Bucket: BOTS_BUCKET,
        Key: `${botPrefix}.zip`,
        Body: codeFile,
      })

      const lambdaResult = await lambda.updateFunctionCode({
        FunctionName: botPrefix,
        S3Bucket: BOTS_BUCKET,
        S3Key: `${botPrefix}.zip`,
      })

      if (active && tasks[0].service?.name === ServiceName.schedule) {
        await scheduler.updateSchedule({
          Name: botPrefix,
          State: 'ENABLED',
          ScheduleExpression: tasks[0].inputData.find(
            (input) => input.name === 'expression'
          )?.value as string,
          ScheduleExpressionTimezone: tasks[0].inputData.find(
            (input) => input.name === 'timeZone'
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
          Name: botPrefix,
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
        TableName: CORE_TABLE,
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

  async testBot(userId: string, botId: string, task: ITask, taskIndex: string) {
    const lambda = new Lambda({})
    const ddb = DynamoDBDocument.from(new DynamoDB({}), {
      marshallOptions: { removeUndefinedValues: true },
    })

    try {
      let sample: ITaskExecutionResult

      // Get input data from service in both cases to check input data validity
      const inputData = getInputDataFromService(
        task.inputData,
        task.service?.config.inputFields,
        true
      )

      if (parseInt(taskIndex) === 0) {
        const { triggerSamples } = await this.getBot(userId, botId)
        if (!triggerSamples) return
        sample = triggerSamples.reverse()[0]
      } else {
        const testLambdaResult = await lambda.invoke({
          FunctionName: `${SERVICE_PREFIX}-task-${task.service?.name}`,
          Payload: JSON.stringify({
            botId,
            userId,
            connectionId: task.connectionId,
            appConfig: task.app?.config,
            serviceConfig: task.service?.config,
            inputData,
          }) as unknown as Uint8Array,
        })

        const testLambdaPayload = JSON.parse(
          new TextDecoder().decode(testLambdaResult.Payload),
          (_, value) =>
            !isNaN(value) && value > Number.MAX_SAFE_INTEGER
              ? value.toString()
              : value
        )

        sample = {
          inputData,
          outputData: testLambdaPayload.data,
          status: testLambdaPayload.success
            ? TaskExecutionStatus.success
            : TaskExecutionStatus.fail,
          timestamp: Date.now(),
        }
      }

      validateTaskResult(sample)

      await ddb.update({
        TableName: CORE_TABLE,
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

  async addTriggerSample(
    userId: string,
    botId: string,
    sample: ITaskExecutionResult
  ) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}), {
      marshallOptions: { removeUndefinedValues: true },
    })

    try {
      await ddb.update({
        TableName: CORE_TABLE,
        Key: { userId, sortKey: `#BOT#${botId}` },
        ReturnValues: 'ALL_NEW',
        UpdateExpression:
          'set triggerSamples = list_append(if_not_exists(triggerSamples, :emptyList), :sampleList)',
        ExpressionAttributeValues: {
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
        TableName: CORE_TABLE,
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
