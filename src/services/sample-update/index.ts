'use strict'

import { Api } from 'src/utils/api'
import { Bot } from 'src/controllers/bot'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const bot = new Bot()

  try {
    const { userId, botId, taskIndex, status, inputData, outputData } = event

    const sample = {
      status,
      inputData,
      outputData,
      timestamp: Date.now(),
    }

    const data = await bot.addSampleResult(userId, botId, taskIndex, sample)

    api.httpResponse(callback, 'success', undefined, data)
  } catch (err) {
    api.httpResponse(callback, 'fail', err)
  }
}
