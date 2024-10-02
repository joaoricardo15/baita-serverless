'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { Bot } from 'src/controllers/bot'
import {
  validateTaskExecutionInput,
  validateTaskExecutionResult,
} from 'src/models/bot/schema'
import { ITaskExecutionInput, TaskExecutionStatus } from 'src/models/bot/interface'
import { DataType } from 'src/models/service/interface'

interface ITriggerSample {
  status: TaskExecutionStatus
  inputData: DataType
  outputData: DataType
}

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const bot = new Bot()

  try {
    validateTaskExecutionInput(event)

    const { userId, botId, inputData } =
      event as ITaskExecutionInput<ITriggerSample>

    const sample = {
      status: inputData.status,
      inputData: inputData.inputData,
      outputData: inputData.outputData,
      timestamp: Date.now(),
    }

    validateTaskExecutionResult(sample)

    const data = await bot.addTriggerSample(userId, botId, sample)

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
