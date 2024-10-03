import Api, { ApiRequestStatus } from 'src/utils/api'
import { validateTasks } from 'src/models/bot/schema'
import Bot from 'src/controllers/bot'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const bot = new Bot()

  try {
    const { userId, botId, taskIndex } = event.pathParameters

    const task = JSON.parse(event.body)

    validateTasks([task])

    const data = await bot.testBot(userId, botId, task, taskIndex)

    api.httpResponse(callback, ApiRequestStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, ApiRequestStatus.fail, err)
  }
}
