'use strict'

import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { IBotLog, IBotUsage } from 'src/models/log'

const LOGS_TABLE = process.env.LOGS_TABLE || ''

export class Log {
  async getBotLogs(botId: string) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      const result = await ddb.query({
        TableName: LOGS_TABLE,
        Limit: 20,
        KeyConditionExpression: 'botId = :botId',
        ExpressionAttributeValues: {
          ':botId': botId,
        },
        ScanIndexForward: false,
      })

      return result.Items
    } catch (err) {
      throw err.message
    }
  }

  async getBotUsage(botId: string) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

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
        const result = await ddb.query(queryParams)

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
}
