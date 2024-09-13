'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { Bot } from 'src/controllers/bot'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const bot = new Bot()

  try {
    const { botId } = event.pathParameters

    const data = await bot.getBotLogs(
      botId,
      event.queryStringParameters?.searchTerm
    )

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
