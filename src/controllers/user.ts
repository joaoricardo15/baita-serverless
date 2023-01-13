'use strict'

import { SQS } from '@aws-sdk/client-sqs'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { IPost, ITodoTask, IUser } from 'src/models/user/interface'

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

  async getContent(userId: string) {
    const sqs = new SQS({})

    try {
      const queueUrlResult = await sqs.getQueueUrl({
        QueueName: `${SERVICE_PREFIX.replace('dev', 'prod')}-${userId}`,
      })

      const messagesResult = await sqs.receiveMessage({
        QueueUrl: queueUrlResult.QueueUrl,
        MaxNumberOfMessages: 10,
      })

      if (!messagesResult.Messages) {
        return []
      }

      await sqs.deleteMessageBatch({
        QueueUrl: queueUrlResult.QueueUrl,
        Entries: messagesResult.Messages?.map((message) => ({
          Id: message.MessageId,
          ReceiptHandle: message.ReceiptHandle,
        })),
      })

      return messagesResult.Messages.map((message) => {
        if (message.Body)
          try {
            return JSON.parse(message.Body)
          } catch (err) {
            return null
          }
      }).filter((message) => message)
    } catch (err) {
      throw err.message
    }
  }

  async publishContent(userId: string, posts: IPost[]) {
    const sqs = new SQS({})

    try {
      const queueResult = await sqs.getQueueUrl({
        QueueName: `${SERVICE_PREFIX.replace('dev', 'prod')}-${userId}`,
      })

      await sqs.sendMessageBatch({
        QueueUrl: queueResult.QueueUrl,
        Entries: posts.slice(0, 10).map((entry, index) => ({
          Id: index.toString(),
          MessageBody: JSON.stringify(entry),
        })),
      })
    } catch (err) {
      throw err.message
    }
  }

  async getTodo(userId: string) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      const result = await ddb.get({
        TableName: USERS_TABLE,
        Key: { userId, sortKey: '#TODO' },
      })

      return result.Item as ITodoTask[]
    } catch (err) {
      throw err.message
    }
  }

  async updateTodo(userId: string, tasks: ITodoTask[]) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      await ddb.update({
        TableName: USERS_TABLE,
        Key: { userId, sortKey: '#TODO' },
        UpdateExpression: 'SET tasks = :tasks',
        ExpressionAttributeValues: {
          ':tasks': tasks,
        },
        ReturnValues: 'ALL_NEW',
      })

      return tasks
    } catch (err) {
      throw err.message
    }
  }
}
