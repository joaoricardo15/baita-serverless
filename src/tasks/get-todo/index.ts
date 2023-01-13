'use strict'

import { validateOperationInput } from 'src/models/bot/schema'
import { Api, BotStatus } from 'src/utils/api'
import { User } from 'src/controllers/user'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const user = new User()

  try {
    validateOperationInput(event)

    const { userId, inputData } = event

    const {
      // Custom fields
      ...customFields
    } = inputData

    const data = await user.getTodo(userId)

    api.httpOperationResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}
