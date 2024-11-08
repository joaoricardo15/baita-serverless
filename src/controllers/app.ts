import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { IBotModel } from 'src/models/bot/interface'

const CORE_TABLE = process.env.CORE_TABLE || ''

class App {
  async getBotModels() {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      const result = await ddb.query({
        TableName: CORE_TABLE,
        KeyConditionExpression:
          'userId = :userId and begins_with(sortKey, :sortKey)',
        ExpressionAttributeValues: {
          ':userId': 'baita',
          ':sortKey': '#MODEL',
        },
      })

      return result.Items as IBotModel[]
    } catch (err) {
      throw err.message || err
    }
  }

  async publishBotModel(model: IBotModel) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}), {
      marshallOptions: { removeUndefinedValues: true },
    })

    try {
      await ddb.put({
        TableName: CORE_TABLE,
        Item: {
          userId: 'baita',
          sortKey: `#MODEL#${model.modelId}`,
          ...model,
        },
      })

      return model
    } catch (err) {
      throw err.message || err
    }
  }

  async deleteBotModel(modelId: string) {
    const ddb = DynamoDBDocument.from(new DynamoDB({}))

    try {
      await ddb.delete({
        TableName: CORE_TABLE,
        Key: { userId: 'baita', sortKey: `#MODEL#${modelId}` },
      })
    } catch (err) {
      throw err.message || err
    }
  }
}

export default App

