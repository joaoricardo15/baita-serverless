import Api, { ApiRequestStatus } from 'src/utils/api'
import { validateTasks } from 'src/models/bot/schema'
import Bot from 'src/controllers/bot'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const bot = new Bot()

  try {
    const { userId, botId } = event.pathParameters

    const body = JSON.parse(event.body)

    const { name, author, description, image, tasks } = body

    validateTasks(tasks)

    const data = await bot.deployBotModel(userId, {
      modelId: botId,
      author,
      name,
      image,
      description,
      tasks,
    })

    api.httpResponse(callback, ApiRequestStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, ApiRequestStatus.fail, err)
  }
}
