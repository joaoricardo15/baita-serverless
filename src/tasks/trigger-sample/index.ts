import Api from 'src/utils/api'
import Bot from 'src/controllers/bot'
import {
  validateTaskExecutionInput,
  validateTaskExecutionResult,
} from 'src/models/bot/schema'
import { DataType } from 'src/models/service/interface'
import {
  ITaskExecutionInput,
  TaskExecutionStatus,
} from 'src/models/bot/interface'

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

    api.taskExecutionResponse(
      callback,
      TaskExecutionStatus.success,
      undefined,
      data
    )
  } catch (err) {
    api.taskExecutionResponse(callback, TaskExecutionStatus.fail, err)
  }
}
