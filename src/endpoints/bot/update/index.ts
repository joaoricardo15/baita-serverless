'use strict'

import { validateTasks } from 'src/models/bot/schema'
import { Api, BotStatus } from 'src/utils/api'
import { Bot } from 'src/controllers/bot'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const bot = new Bot()

  try {
    const { userId, botId } = event.pathParameters

    const body = JSON.parse(event.body)

    const { name, image, description, active, tasks } = body

    validateTasks(tasks)

    const data = await bot.updateBot(
      userId,
      botId,
      name,
      image,
      description,
      active,
      tasks
    )

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
