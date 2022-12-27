'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { Log } from 'src/controllers/log'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const log = new Log()

  try {
    const { userId, botId, usage, logs, error } = event

    const logSet = {
      userId,
      botId,
      error,
      timestamp: Date.now(),
      usage,
      logs,
    }

    const data = await log.createLog(logSet)

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
