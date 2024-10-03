import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { IAppConnection } from 'src/models/connection/interface'

const CORE_TABLE = process.env.CORE_TABLE || ''

export class Connection {
  async getConnection(userId: string, connectionId: string) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      const result = await ddb.get({
        TableName: CORE_TABLE,
        Key: { userId, sortKey: `#CONNECTION#${connectionId}` },
      })

      return result.Item as IAppConnection
    } catch (err) {
      throw err.message || err
    }
  }

  async getUserConnections(userId: string) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      const result = await ddb.query({
        TableName: CORE_TABLE,
        KeyConditionExpression:
          'userId = :userId and begins_with(sortKey, :sortKey)',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':sortKey': '#CONNECTION',
        },
      })

      return result.Items as Array<IAppConnection>
    } catch (err) {
      throw err.message || err
    }
  }

  async createConnection(connection: IAppConnection) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}), {
      marshallOptions: { removeUndefinedValues: true },
    })

    try {
      await ddb.put({
        TableName: CORE_TABLE,
        Item: {
          ...connection,
          sortKey: `#CONNECTION#${connection.connectionId}`,
        },
      })

      return connection
    } catch (err) {
      throw err.message || err
    }
  }
}
