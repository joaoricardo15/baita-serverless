'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { validateOperationInput } from 'src/models/bot/schema'
import { MethodName } from 'src/models/service/interface'
import { getTodo, publishToFeed } from './methods/user'
import { sendNotification } from './methods/firebase'
import { httpRequest } from './methods/http'

const METHODS: { [key in MethodName]: Function } = {
  getTodo,
  publishToFeed,
  sendNotification,
  httpRequest,
}

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)

  try {
    validateOperationInput(event)

    const data = await METHODS[event.serviceConfig.methodName as string](event)

    api.httpOperationResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}
