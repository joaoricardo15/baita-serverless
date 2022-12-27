'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { Log } from 'src/controllers/log'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const log = new Log()

  try {
    const { botId } = event.pathParameters

    const data = await log.getBotLogs(botId)

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
