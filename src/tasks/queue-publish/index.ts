'use strict'

import { User } from 'src/controllers/user'
import { validateOperationInput } from 'src/models/bot/schema'
import { validateContent } from 'src/models/user/schema'

import { Api, BotStatus } from 'src/utils/api'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const user = new User()

  try {
    validateOperationInput(event)

    const { userId, inputData } = event

    const {
      // Required fields
      content,

      // Custom fields
      ...customFields
    } = inputData

    if (Array.isArray(content)) {
      validateContent(content)
      await user.publishContent(userId, content)
    } else {
      validateContent([content])
      await user.publishContent(userId, [content])
    }

    api.httpOperationResponse(callback, BotStatus.success, undefined, {
      message: 'Content published successfully.',
    })
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}
