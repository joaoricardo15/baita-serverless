'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { Bot } from 'src/controllers/bot'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const bot = new Bot()

  try {
    const { userId, botId } = event.pathParameters

    const body = JSON.parse(event.body)

    const { taskIndex } = body

    const data = await bot.testBot(decodeURI(userId), botId, taskIndex)

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
