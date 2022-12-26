'use strict'

import AWS from 'aws-sdk'
import { IConnection, validateConnection } from './interface'

const USERS_TABLE = process.env.USERS_TABLE || ''

export class Connection {
  async getConnection(userId: string, connectionId: string) {
    const ddb = new AWS.DynamoDB.DocumentClient()

    try {
      const result = await ddb
        .get({
          TableName: USERS_TABLE,
          Key: { userId, sortKey: `#CONNECTION#${connectionId}` },
        })
        .promise()

      return result.Item as IConnection
    } catch (err) {
      throw err.message
    }
  }

  async getUserConnections(userId: string) {
    const ddb = new AWS.DynamoDB.DocumentClient()

    try {
      const result = await ddb
        .query({
          TableName: USERS_TABLE,
          KeyConditionExpression:
            'userId = :userId and begins_with(sortKey, :sortKey)',
          ExpressionAttributeValues: {
            ':userId': userId,
            ':sortKey': '#CONNECTION',
          },
        })
        .promise()

      return result.Items as Array<IConnection>
    } catch (err) {
      throw err.message
    }
  }

  async createConnection(connection: IConnection) {
    const ddb = new AWS.DynamoDB.DocumentClient()

    validateConnection(connection)

    try {
      await ddb
        .put({
          TableName: USERS_TABLE,
          Item: {
            ...connection,
            sortKey: `#CONNECTION#${connection.connectionId}`,
          },
        })
        .promise()

      return connection
    } catch (err) {
      throw err.message
    }
  }
}
