'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { validateOperationInput } from 'src/models/bot/schema'
import { getTodo, publishToFeed } from 'src/tasks/method-execute/methods/user'
import { sendNotification } from 'src/tasks/method-execute/methods/firebase'
import { mapData } from 'src/tasks/method-execute/methods/data'

const METHODS = {
  mapData,
  getTodo,
  publishToFeed,
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
