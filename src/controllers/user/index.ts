'use strict'

import { SQS } from '@aws-sdk/client-sqs'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { IUser } from 'src/models/user'

const USERS_TABLE = process.env.USERS_TABLE || ''
const SERVICE_PREFIX = process.env.SERVICE_PREFIX || ''

export class User {
  async createUser(user: IUser) {
    const sqs = new SQS({})
    const ddb = DynamoDBDocument.from(new DynamoDB({}), {
      marshallOptions: { removeUndefinedValues: true },
    })

    try {
      await ddb.put({
        TableName: USERS_TABLE,
        Item: {
          ...user,
          sortKey: '#USER',
        },
      })

      await sqs.createQueue({
        QueueName: `${SERVICE_PREFIX}-${user.userId}`,
      })

      return user
    } catch (err) {
      throw err.message
    }
  }

  async getMessages(userId: string) {
    const sqs = new SQS({})

    try {
      const queueUrlResult = await sqs.getQueueUrl({
        QueueName: `${SERVICE_PREFIX.replace('dev', 'prod')}-${userId}`,
      })

      const messagesResult = await sqs.receiveMessage({
        QueueUrl: queueUrlResult.QueueUrl,
        MaxNumberOfMessages: 10,
      })

      return (
        messagesResult.Messages?.filter((message) => message.Body).map(
          (message) => JSON.parse(message.Body || '{}')
        ) || []
      )
    } catch (err) {
      throw err.message
    }
  }
}
