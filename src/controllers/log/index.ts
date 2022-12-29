'use strict'

import AWS from 'aws-sdk'
import { IBotLog, IBotUsage } from 'src/models/log'

const LOGS_TABLE = process.env.LOGS_TABLE || ''

export class Log {
  async getBotLogs(botId: string) {
    const ddb = new AWS.DynamoDB.DocumentClient()

    try {
      const result = await ddb
        .query({
          TableName: LOGS_TABLE,
          Limit: 20,
          KeyConditionExpression: 'botId = :botId',
          ExpressionAttributeValues: {
            ':botId': botId,
          },
          ScanIndexForward: false,
        })
        .promise()

      return result.Items as IBotLog[]
    } catch (err) {
      throw err.message
    }
  }

  async getBotUsage(botId: string) {
    const ddb = new AWS.DynamoDB.DocumentClient()

    try {
      let total = 0

      const queryParams = {
        TableName: LOGS_TABLE,
        ProjectionExpression: '#usage',
        ExpressionAttributeNames: {
          '#usage': 'usage', // Expression used here bacause 'usage' is a reserved word
        },
        KeyConditionExpression: 'botId = :botId',
        ExpressionAttributeValues: {
          ':botId': botId,
        },
      }

      const queryBotUsage = async (queryParams) => {
        const result = await ddb.query(queryParams).promise()

        if (result && result.Items) {
          result.Items.forEach((item) => {
            total += item.usage
          })

          if (typeof result.LastEvaluatedKey != 'undefined') {
            queryParams.ExclusiveStartKey = result.LastEvaluatedKey
            return await queryBotUsage(queryParams)
          } else {
            return total
          }
        }
      }

      await queryBotUsage(queryParams)

      return { total } as IBotUsage
    } catch (err) {
      throw err.message
    }
  }

  async createLog(log: IBotLog) {
    const ddb = new AWS.DynamoDB.DocumentClient()

    try {
      await ddb
        .put({
          TableName: LOGS_TABLE,
          Item: log,
        })
        .promise()

      return log
    } catch (err) {
      throw err.message
    }
  }
}
