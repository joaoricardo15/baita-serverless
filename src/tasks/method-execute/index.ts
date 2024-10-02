'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { DataType, MethodName } from 'src/models/service/interface'
import { validateTaskExecutionInput } from 'src/models/bot/schema'
import { ITaskExecutionInput } from 'src/models/bot/interface'
import { httpRequest, oauth2Request } from './methods/http'
import { getTodo, publishToFeed } from './methods/user'
import { sendNotification } from './methods/firebase'

const METHODS: {
  [key in MethodName]: (input: ITaskExecutionInput<DataType>) => DataType
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

    const { serviceConfig } = event as ITaskExecutionInput<any>

    const data = await METHODS[serviceConfig.methodName as string](event)

    api.httpOperationResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}
