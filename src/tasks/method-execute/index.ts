import Api from 'src/utils/api'
import {
  ITaskExecutionInput,
  TaskExecutionStatus,
} from 'src/models/bot/interface'
import { MethodName } from 'src/models/service/interface'
import { validateTaskExecutionInput } from 'src/models/bot/schema'
import { httpRequest, oauth2Request } from './methods/http'
import { getTodo, publishToFeed } from './methods/user'
import { sendNotification } from './methods/firebase'

const METHODS: {
  [key in MethodName]: (input: ITaskExecutionInput<unknown>) => unknown
} = {
  getTodo,
  publishToFeed,
  sendNotification,
  httpRequest,
  oauth2Request,
}

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)

  try {
    validateTaskExecutionInput(event)

    const { serviceConfig } = event as ITaskExecutionInput<unknown>

    const data = await METHODS[serviceConfig.methodName as string](event)

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
