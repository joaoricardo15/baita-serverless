'use strict'

import AWS from 'aws-sdk'
import { IBot, ITask, ITaskResult, TaskStatus } from 'src/models/bot'
import { InputSource } from 'src/models/service'
import { v4 as uuidv4 } from 'uuid'
import { Code } from '../../utils/code'

const USERS_TABLE = process.env.USERS_TABLE || ''
const BOTS_BUCKET = process.env.BOTS_BUCKET || ''
const BOTS_PERMISSION = process.env.BOTS_PERMISSION || ''
const SERVICE_PREFIX = process.env.SERVICE_PREFIX || ''

export class Bot {
  async getBot(userId: string, botId: string) {
    const ddb = new AWS.DynamoDB.DocumentClient()

    try {
      const result = await ddb
        .get({
          TableName: USERS_TABLE,
          Key: { userId, sortKey: `#BOT#${botId}` },
        })
        .promise()

      return result.Item
    } catch (err) {
      throw err.message
    }
  }

  async getBots(userId: string) {
    const ddb = new AWS.DynamoDB.DocumentClient()

    try {
      const result = await ddb
        .query({
          TableName: USERS_TABLE,
          KeyConditionExpression:
            'userId = :userId and begins_with(sortKey, :sortKey)',
          ExpressionAttributeValues: {
            ':userId': userId,
            ':sortKey': '#BOT',
          },
        })
        .promise()

      return result.Items
    } catch (err) {
      throw err.message
    }
  }

  async createBot(userId: string) {
    const ddb = new AWS.DynamoDB.DocumentClient()
    const eventBridge = new AWS.EventBridge()
    const apigateway = new AWS.ApiGatewayV2()
    const lambda = new AWS.Lambda()
    const s3 = new AWS.S3()
    const code = new Code()

    try {
      const botId = uuidv4()

      const sampleCode = code.getSampleCode(userId, botId)
      const codeFile = await code.getCodeFile(sampleCode)

      await s3
        .upload({
          Bucket: BOTS_BUCKET,
          Key: `${botId}.zip`,
          Body: codeFile,
        })
        .promise()

      const lambdaResult = await lambda
        .createFunction({
          FunctionName: `${SERVICE_PREFIX}-${botId}`,
          Handler: 'index.handler',
          Runtime: 'nodejs12.x',
          Role: BOTS_PERMISSION,
          Code: {
            S3Bucket: BOTS_BUCKET,
            S3Key: `${botId}.zip`,
          },
        })
        .promise()

      const botUrl = '/bot'

      const apiResult = await apigateway
        .createApi({
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
        .promise()

      await eventBridge
        .putRule({
          State: 'DISABLED',
          Name: `${SERVICE_PREFIX}-${botId}`,
          // TODO - make it configurable
          ScheduleExpression: 'rate(5 minutes)',
        })
        .promise()

      const targetResult = await eventBridge
        .putTargets({
          Rule: `${SERVICE_PREFIX}-${botId}`,
          Targets: [
            {
              Id: `${SERVICE_PREFIX}-${botId}`,
              Arn: lambdaResult.FunctionArn || '',
            },
          ],
        })
        .promise()
      console.log(targetResult)

      const bot: IBot = {
        botId,
        userId,
        apiId: apiResult.ApiId || '',
        name: '',
        triggerUrl: `${apiResult.ApiEndpoint}${botUrl}`,
        active: false,
        triggerSamples: [],
        tasks: [
          {
            taskId: Date.now(),
            inputData: [],
          },
        ],
      }

      await ddb
        .put({
          TableName: USERS_TABLE,
          Item: {
            ...bot,
            sortKey: `#BOT#${bot.botId}`,
          },
        })
        .promise()

      return bot
    } catch (err) {
      throw err.message
    }
  }

  async deleteBot(userId: string, botId: string, apiId: string) {
    const ddb = new AWS.DynamoDB.DocumentClient()
    const eventBridge = new AWS.EventBridge()
    const apigateway = new AWS.ApiGatewayV2()
    const lambda = new AWS.Lambda()
    const s3 = new AWS.S3()

    try {
      await ddb
        .delete({
          TableName: USERS_TABLE,
          Key: { userId, sortKey: `#BOT#${botId}` },
        })
        .promise()

      await apigateway.deleteApi({ ApiId: apiId }).promise()

      await eventBridge
        .deleteRule({
          Name: `${SERVICE_PREFIX}-${botId}`,
        })
        .promise()

      await lambda
        .deleteFunction({ FunctionName: `${SERVICE_PREFIX}-${botId}` })
        .promise()

      await s3
        .deleteObject({ Bucket: BOTS_BUCKET, Key: `${botId}.zip` })
        .promise()
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
    const ddb = new AWS.DynamoDB.DocumentClient()

    try {
      const result = await ddb
        .update({
          TableName: USERS_TABLE,
          Key: { userId, sortKey: `#BOT#${botId}` },
          UpdateExpression:
            'set #name = :name, tasks = :tasks, active = :active',
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
        .promise()

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
    const ddb = new AWS.DynamoDB.DocumentClient()
    const eventBridge = new AWS.EventBridge()
    const lambda = new AWS.Lambda()
    const s3 = new AWS.S3()
    const code = new Code()

    try {
      const botCode = code.mountBotCode(userId, botId, active, tasks)
      const codeFile = await code.getCodeFile(botCode)

      await s3
        .upload({
          Bucket: BOTS_BUCKET,
          Key: `${botId}.zip`,
          Body: codeFile,
        })
        .promise()

      await lambda
        .updateFunctionCode({
          FunctionName: `${SERVICE_PREFIX}-${botId}`,
          S3Bucket: BOTS_BUCKET,
          S3Key: `${botId}.zip`,
        })
        .promise()

      if (active) {
        await eventBridge
          .enableRule({
            Name: `${SERVICE_PREFIX}-${botId}`,
          })
          .promise()
      } else {
        await eventBridge
          .disableRule({
            Name: `${SERVICE_PREFIX}-${botId}`,
          })
          .promise()
      }

      const dbResult = await ddb
        .update({
          TableName: USERS_TABLE,
          Key: { userId, sortKey: `#BOT#${botId}` },
          UpdateExpression:
            'set #name = :name, tasks = :tasks, active = :active',
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
        .promise()

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
    const lambda = new AWS.Lambda()

    try {
      const inputData = this.getTestInput(task)

      const testLambdaResult = await lambda
        .invoke({
          FunctionName: `${SERVICE_PREFIX}-${task.service?.name}`,
          Payload: JSON.stringify({
            userId,
            connectionId: task.connectionId,
            appConfig: task.app?.config,
            serviceConfig: task.service?.config,
            inputData,
          }),
        })
        .promise()

      const testLambdaPayload = JSON.parse(testLambdaResult.Payload as string)

      const sample = {
        inputData,
        outputData: testLambdaPayload.data,
        status: testLambdaPayload.success
          ? TaskStatus.success
          : TaskStatus.fail,
        timestamp: Date.now(),
      }

      await this.addSampleResult(userId, botId, taskIndex, sample)

      return sample
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
    const ddb = new AWS.DynamoDB.DocumentClient()
    try {
      await ddb
        .update({
          TableName: USERS_TABLE,
          Key: { userId, sortKey: `#BOT#${botId}` },
          UpdateExpression: `set tasks[${taskIndex}].connectionId = :connectionId`,
          ExpressionAttributeValues: {
            ':connectionId': connectionId,
          },
          ReturnValues: 'ALL_NEW',
        })
        .promise()
    } catch (err) {
      throw err.message
    }
  }

  async addSampleResult(
    userId: string,
    botId: string,
    taskIndex: number,
    sample: ITaskResult
  ) {
    const ddb = new AWS.DynamoDB.DocumentClient()

    try {
      let UpdateExpression: string, ExpressionAttributeValues: object

      if (taskIndex == 0) {
        UpdateExpression = `set tasks[${taskIndex}].sampleResult = :sample,
          triggerSamples = list_append(if_not_exists(triggerSamples, :emptyList), :sampleList)`
        ExpressionAttributeValues = {
          ':sample': sample,
          ':sampleList': [sample],
          ':emptyList': [],
        }
      } else {
        UpdateExpression = `set tasks[${taskIndex}].sampleResult = :sample`
        ExpressionAttributeValues = {
          ':sample': sample,
        }
      }

      const result = await ddb
        .update({
          TableName: USERS_TABLE,
          Key: { userId, sortKey: `#BOT#${botId}` },
          ReturnValues: 'ALL_NEW',
          UpdateExpression,
          ExpressionAttributeValues,
        })
        .promise()

      return result.Attributes
    } catch (err) {
      throw err.message
    }
  }
}
