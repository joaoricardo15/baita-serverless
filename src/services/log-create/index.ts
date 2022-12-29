'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { Log } from 'src/controllers/log'
import { validateLog } from 'src/controllers/log/schema'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const log = new Log()

  try {
    const { userId, botId, usage, logs, error } = event

    const newLog = {
      userId,
      botId,
      error,
      usage,
      logs,
      timestamp: Date.now(),
    }

    validateLog(newLog)

    const data = await log.createLog(newLog)

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
