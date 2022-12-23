'use strict'

import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import { Code } from '../../utils/code'

const BOTS_TABLE = process.env.BOTS_TABLE || ''
const BOTS_BUCKET = process.env.BOTS_BUCKET || ''
const BOTS_PERMISSION = process.env.BOTS_PERMISSION || ''
const SERVICE_PREFIX = process.env.SERVICE_PREFIX || ''

export class Bot {
  async getBot(userId: string, botId: string) {
    const ddb = new AWS.DynamoDB.DocumentClient()

    try {
      const result = await ddb
        .get({
          TableName: BOTS_TABLE,
          Key: { userId, botId },
        })
        .promise()

      return result.Item
    } catch (err) {
      throw err.message
    }
  }

  async getBotsByUser(userId: string) {
    const ddb = new AWS.DynamoDB.DocumentClient()

    try {
      const result = await ddb
        .query({
          TableName: BOTS_TABLE,
          KeyConditionExpression: 'userId = :id',
          ExpressionAttributeValues: {
            ':id': userId,
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

      const bot = {
        botId,
        userId,
        apiId: apiResult.ApiId,
        triggerUrl: `${apiResult.ApiEndpoint}${botUrl}`,
        name: '',
        active: false,
        tasks: [
          {
            id: Date.now(),
            type: 'trigger',
          },
        ],
      }

      await ddb
        .put({
          TableName: BOTS_TABLE,
          Item: bot,
        })
        .promise()

      return bot
    } catch (err) {
      throw err.message
    }
  }

  async deleteBot(userId: string, botId: string, apiId: string) {
    const ddb = new AWS.DynamoDB.DocumentClient()
    const apigateway = new AWS.ApiGatewayV2()
    const lambda = new AWS.Lambda()
    const s3 = new AWS.S3()

    try {
      await ddb
        .delete({ TableName: BOTS_TABLE, Key: { userId, botId } })
        .promise()

      await apigateway.deleteApi({ ApiId: apiId }).promise()

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
    tasks: object
  ) {
    const ddb = new AWS.DynamoDB.DocumentClient()

    try {
      const result = await ddb
        .update({
          TableName: BOTS_TABLE,
          Key: { botId, userId },
          UpdateExpression: 'set #tk = :tk, #nm = :nm, #act = :act',
          ExpressionAttributeNames: {
            '#tk': 'tasks',
            '#nm': 'name',
            '#act': 'active',
          },
          ExpressionAttributeValues: {
            ':tk': tasks,
            ':nm': name,
            ':act': active,
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
    tasks: object
  ) {
    const ddb = new AWS.DynamoDB.DocumentClient()
    const lambda = new AWS.Lambda()
    const s3 = new AWS.S3()
    const code = new Code()

    try {
      const botCode = code.getBotCode(userId, botId, active, tasks)
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

      const dbResult = await ddb
        .update({
          TableName: BOTS_TABLE,
          Key: { botId, userId },
          UpdateExpression: 'set #tk = :tk, #act = :act, #nm = :nm',
          ExpressionAttributeNames: {
            '#tk': 'tasks',
            '#nm': 'name',
            '#act': 'active',
          },
          ExpressionAttributeValues: {
            ':tk': tasks,
            ':nm': name,
            ':act': active,
          },
          ReturnValues: 'ALL_NEW',
        })
        .promise()

      return dbResult.Attributes
    } catch (err) {
      throw err.message
    }
  }

  async testBot(userId: string, botId: string, taskIndex: number) {
    const lambda = new AWS.Lambda()

    try {
      const testLambdaResult = await lambda
        .invoke({
          FunctionName: `${SERVICE_PREFIX}-${botId}`,
          Payload: JSON.stringify({ testTaskIndex: taskIndex }),
        })
        .promise()

      const testLambdaParsedPayload = JSON.parse(
        testLambdaResult.Payload as string
      )

      const testLambdaParsedResult = JSON.parse(testLambdaParsedPayload.body)

      const executionSuccess = testLambdaParsedResult.success

      const taskOutputData =
        executionSuccess && testLambdaParsedResult.data
          ? testLambdaParsedResult.data
          : {
              message:
                testLambdaParsedResult.message ||
                testLambdaParsedResult.errorMessage ||
                'nothing for you this time : (',
            }

      const updateLambdaResult = await lambda
        .invoke({
          FunctionName: `${SERVICE_PREFIX}-sample-update`,
          Payload: JSON.stringify({
            userId,
            botId,
            taskIndex,
            status: taskOutputData.status,
            inputData: taskOutputData.inputData,
            outputData: taskOutputData.outputData,
          }),
        })
        .promise()

      const updateLambdaParsedPayload = JSON.parse(
        updateLambdaResult.Payload as string
      )

      const updateLambdaParsedResult = JSON.parse(
        updateLambdaParsedPayload.body
      )

      return updateLambdaParsedResult.data
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
          TableName: BOTS_TABLE,
          Key: { botId, userId },
          UpdateExpression: `set #tks[${taskIndex}].connectionId = :id`,
          ExpressionAttributeNames: {
            '#tks': 'tasks',
          },
          ExpressionAttributeValues: {
            ':id': connectionId,
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
    sample: object
  ) {
    const ddb = new AWS.DynamoDB.DocumentClient()

    try {
      let UpdateExpression: any,
        ExpressionAttributeNames: any,
        ExpressionAttributeValues: any

      if (taskIndex == 0) {
        UpdateExpression = `set #tks[${taskIndex}].sampleResult = :sample, #tg = list_append(if_not_exists(#tg, :emptyList), :sampleList)`
        ExpressionAttributeNames = {
          '#tks': 'tasks',
          '#tg': 'triggerSamples',
        }
        ExpressionAttributeValues = {
          ':sample': sample,
          ':emptyList': [],
          ':sampleList': [sample],
        }
      } else {
        UpdateExpression = `set #tks[${taskIndex}].sampleResult = :sample`
        ExpressionAttributeNames = {
          '#tks': 'tasks',
        }
        ExpressionAttributeValues = {
          ':sample': sample,
        }
      }

      const result = await ddb
        .update({
          TableName: BOTS_TABLE,
          Key: { botId, userId },
          ReturnValues: 'ALL_NEW',
          UpdateExpression,
          ExpressionAttributeNames,
          ExpressionAttributeValues,
        })
        .promise()

      return result.Attributes
    } catch (err) {
      throw err.message
    }
  }
}
