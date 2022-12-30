'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { Bot } from 'src/controllers/bot'
import { validateTask } from 'src/controllers/bot/schema'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const bot = new Bot()

  try {
    const { userId, botId, taskIndex } = event.pathParameters

    const task = JSON.parse(event.body)

    validateTask(task)

    const data = await bot.testBot(userId, botId, task, taskIndex)

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
