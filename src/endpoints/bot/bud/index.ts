'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { Bot } from 'src/controllers/bot'
import { validateTasks } from 'src/models/bot/schema'

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

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
