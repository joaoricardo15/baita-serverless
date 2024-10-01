'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { MethodName } from 'src/models/service/interface'
import { validateOperationInput } from 'src/models/bot/schema'
import { httpRequest, oauth2Request } from './methods/http'
import { getTodo, publishToFeed } from './methods/user'
import { sendNotification } from './methods/firebase'

const METHODS: { [key in MethodName]: Function } = {
  getTodo,
  publishToFeed,
  sendNotification,
  httpRequest,
  oauth2Request,
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
