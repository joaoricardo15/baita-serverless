import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'

const CORE_TABLE = process.env.CORE_TABLE || ''

export const resourceOperations = ['list', 'read', 'delete', 'create', 'update']

class Resource {
  userId: string
  resourceName: string
  private ddb

  constructor(userId: string, resourceName: string) {
    this.userId = userId
    this.resourceName = resourceName.toUpperCase()
    this.ddb = DynamoDBDocument.from(new DynamoDB({}), {
      marshallOptions: { removeUndefinedValues: true },
    })
  }

  sortKey(resourceId?: string) {
    return '#' + this.resourceName + (!resourceId ? '' : '#' + resourceId)
  }

  async list() {
    try {
      const result = await this.ddb.query({
        TableName: CORE_TABLE,
        KeyConditionExpression:
          'userId = :userId and begins_with(sortKey, :sortKey)',
        ExpressionAttributeValues: {
          ':userId': this.userId,
          ':sortKey': this.sortKey(),
        },
      })

      return result.Items
    } catch (err) {
      throw err.message || err
    }
  }

  async read(resourceId?: string) {
    try {
      const result = await this.ddb.get({
        TableName: CORE_TABLE,
        Key: {
          userId: this.userId,
          sortKey: this.sortKey(resourceId),
        },
      })

      return result.Item
    } catch (err) {
      throw err.message || err
    }
  }

  async delete(resourceId: string) {
    try {
      await this.ddb.delete({
        TableName: CORE_TABLE,
        Key: {
          userId: this.userId,
          sortKey: this.sortKey(resourceId),
        },
      })
    } catch (err) {
      throw err.message || err
    }
  }

  async create(resourceId: string, resource) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      await ddb.put({
        TableName: CORE_TABLE,
        Item: {
          userId: this.userId,
          sortKey: this.sortKey(resourceId),
          ...resource,
        },
      })
    } catch (err) {
      throw err.message || err
    }
  }

  async update(resourceId: string, resource) {
    try {
      const resourceKeys = Object.keys(resource)

      await this.ddb.update({
        TableName: CORE_TABLE,
        Key: {
          userId: this.userId,
          sortKey: this.sortKey(resourceId),
        },
        UpdateExpression: `SET ${resourceKeys.map((k, index) => `#field${index} = :value${index}`).join(', ')}`,
        ExpressionAttributeNames: resourceKeys.reduce(
          (accumulator, k, index) => ({
            ...accumulator,
            [`#field${index}`]: k,
          }),
          {}
        ),
        ExpressionAttributeValues: resourceKeys.reduce(
          (accumulator, k, index) => ({
            ...accumulator,
            [`:value${index}`]: resource[k],
          }),
          {}
        ),
      })
    } catch (err) {
      throw err.message || err
    }
  }
}

export default Resource
