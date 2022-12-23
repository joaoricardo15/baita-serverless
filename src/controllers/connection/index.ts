'use strict'

import AWS from 'aws-sdk'
import { IConnection, validateConnection } from './interface'

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || ''

export class Connection {
  async getConnection(userId: string, connectionId: string) {
    const ddb = new AWS.DynamoDB.DocumentClient()

    try {
      const result = await ddb
        .get({ TableName: CONNECTIONS_TABLE, Key: { userId, connectionId } })
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
          TableName: CONNECTIONS_TABLE,
          KeyConditionExpression: '#user = :user',
          ProjectionExpression: '#user,#app,#connection,#name,#email',
          ExpressionAttributeNames: {
            '#app': 'appId',
            '#name': 'name',
            '#email': 'email',
            '#user': 'userId',
            '#connection': 'connectionId',
          },
          ExpressionAttributeValues: {
            ':user': userId,
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
          TableName: CONNECTIONS_TABLE,
          Item: connection,
        })
        .promise()

      return connection
    } catch (err) {
      throw err.message
    }
  }
}
