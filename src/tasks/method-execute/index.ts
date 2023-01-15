'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { validateOperationInput } from 'src/models/bot/schema'
import { sendNotification } from 'src/utils/firebase'

const METHODS = {
  sendNotification,
}

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)

  try {
    validateOperationInput(event)

    const {
      serviceConfig: { method },
    } = event

    const data = await METHODS[method as string](event)

    api.httpOperationResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}
