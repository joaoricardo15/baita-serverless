'use strict'

import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { IAppConnection } from 'src/models/app/interface'
import { IBotModel } from 'src/models/bot/interface'

const USERS_TABLE = process.env.USERS_TABLE || ''

export class App {
  async getBotModels() {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      const result = await ddb.query({
        TableName: USERS_TABLE,
        KeyConditionExpression:
          'userId = :userId and begins_with(sortKey, :sortKey)',
        ExpressionAttributeValues: {
          ':userId': 'baita',
          ':sortKey': '#MODEL',
        },
      })

      return result.Items as IBotModel[]
    } catch (err) {
      throw err.message
    }
  }

  async publishBotModel(model: IBotModel) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      await ddb.put({
        TableName: USERS_TABLE,
        Item: {
          userId: 'baita',
          sortKey: `#MODEL#${model.modelId}`,
          ...model,
        },
      })

      return model
    } catch (err) {
      throw err.message
    }
  }
}

export class Connection {
  async getConnection(userId: string, connectionId: string) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      const result = await ddb.get({
        TableName: USERS_TABLE,
        Key: { userId, sortKey: `#CONNECTION#${connectionId}` },
      })

      return result.Item as IAppConnection
    } catch (err) {
      throw err.message
    }
  }

  async getUserConnections(userId: string) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      const result = await ddb.query({
        TableName: USERS_TABLE,
        KeyConditionExpression:
          'userId = :userId and begins_with(sortKey, :sortKey)',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':sortKey': '#CONNECTION',
        },
      })

      return result.Items as IAppConnection[]
    } catch (err) {
      throw err.message
    }
  }

  async createConnection(connection: IAppConnection) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}), {
      marshallOptions: { removeUndefinedValues: true },
    })

    try {
      await ddb.put({
        TableName: USERS_TABLE,
        Item: {
          ...connection,
          sortKey: `#CONNECTION#${connection.connectionId}`,
        },
      })

      return connection
    } catch (err) {
      throw err.message
    }
  }
}
