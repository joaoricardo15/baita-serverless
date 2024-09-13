'use strict'

import { validateTaskResult } from 'src/models/bot/schema'
import { Api, BotStatus } from 'src/utils/api'
import { Bot } from 'src/controllers/bot'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const bot = new Bot()

  try {
    const { userId, botId, status, inputData, outputData } = event

    const sample = {
      status,
      inputData,
      outputData,
      timestamp: Date.now(),
    }

    validateTaskResult(sample)

    const data = await bot.addTriggerSample(userId, botId, sample)

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
