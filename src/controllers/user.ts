'use strict'

import { SQS } from '@aws-sdk/client-sqs'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { IContent, ITodoTask, IUser } from 'src/models/user/interface'

const CORE_TABLE = process.env.CORE_TABLE || ''
const SERVICE_PREFIX = process.env.SERVICE_PREFIX || ''

export class User {
  async createUser(user: IUser) {
    const sqs = new SQS({})
    const ddb = DynamoDBDocument.from(new DynamoDB({}), {
      marshallOptions: { removeUndefinedValues: true },
    })

    try {
      await ddb.put({
        TableName: CORE_TABLE,
        Item: {
          ...user,
          sortKey: '#USER',
        },
      })

      await sqs.createQueue({
        QueueName: `${SERVICE_PREFIX}-${user.userId}`,
        Attributes: {
          MessageRetentionPeriod: (60 * 60 * 24 * 2).toString(),
        },
      })

      return user
    } catch (err) {
      throw err.message || err
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
      throw err.message || err
    }
  }

  async reactToContent(
    userId: string,
    contentId: string,
    content: IContent,
    reaction: string
  ) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      await ddb.put({
        TableName: CORE_TABLE,
        Item: {
          userId,
          sortKey: `#CONTENT#${contentId}`,
          ...content,
          reaction,
        },
      })
      return content
    } catch (err) {
      throw err.message || err
    }
  }

  async publishContent(userId: string, content: IContent[]) {
    const sqs = new SQS({})
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      // TODO: Workaround to get the queue url
      const queueResult = await sqs.getQueueUrl({
        QueueName: `${SERVICE_PREFIX}-${userId}`,
      })

      console.log(content)

      const { Items: alreadySeen } = await ddb.query({
        TableName: CORE_TABLE,
        KeyConditionExpression:
          'userId = :userId and begins_with(sortKey, :sortKey)',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':sortKey': '#CONTENT',
        },
      })

      console.log(alreadySeen)

      const newContent = !alreadySeen
        ? content.slice(0, 10)
        : content
            .filter(
              ({ contentId }) =>
                !alreadySeen.map((c) => c.contentId).includes(contentId)
            )
            .slice(0, 10)

      console.log(newContent)

      if (newContent.length > 0) {
        await sqs.sendMessageBatch({
          QueueUrl: queueResult.QueueUrl,
          Entries: newContent.map((entry, index) => ({
            Id: index.toString(),
            MessageBody: JSON.stringify(entry),
          })),
        })
      }
    } catch (err) {
      throw err.message || err
    }
  }

  async getTodo(userId: string) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      const result = await ddb.get({
        TableName: CORE_TABLE,
        Key: { userId, sortKey: '#TODO' },
      })

      return (result.Item?.tasks || []) as ITodoTask[]
    } catch (err) {
      throw err.message || err
    }
  }

  async updateTodo(userId: string, tasks: ITodoTask[]) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      await ddb.update({
        TableName: CORE_TABLE,
        Key: { userId, sortKey: '#TODO' },
        UpdateExpression: 'SET tasks = :tasks',
        ExpressionAttributeValues: {
          ':tasks': tasks,
        },
        ReturnValues: 'ALL_NEW',
      })

      return tasks
    } catch (err) {
      throw err.message || err
    }
  }

  async doneTodo(userId: string, taskId: string) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      const result = await ddb.get({
        TableName: CORE_TABLE,
        Key: { userId, sortKey: '#TODO' },
      })

      const tasks = (result.Item?.tasks || []) as ITodoTask[]

      const updatedTasks = tasks.map((task) =>
        task.taskId === taskId
          ? { ...task, done: true, updatedAt: Date.now() }
          : task
      )

      await ddb.update({
        TableName: CORE_TABLE,
        Key: { userId, sortKey: '#TODO' },
        UpdateExpression: 'SET tasks = :tasks',
        ExpressionAttributeValues: {
          ':tasks': updatedTasks,
        },
        ReturnValues: 'NONE',
      })

      return
    } catch (err) {
      throw err.message || err
    }
  }
}
