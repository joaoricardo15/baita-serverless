'use strict'

import Axios from 'axios'
import { validateOperationInput } from 'src/controllers/bot/schema'
import { Api, BotStatus } from 'src/utils/api'
import { User } from 'src/controllers/user'
import { validatePosts } from 'src/controllers/user/schema'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const user = new User()

  try {
    validateOperationInput(event)

    const { userId, inputData } = event

    if (Array.isArray(inputData)) {
      validatePosts(inputData)
      await user.publishContent(userId, inputData)
    } else {
      validatePosts([inputData])
      await user.publishContent(userId, [inputData])
    }

    api.httpOperationResponse(callback, BotStatus.success, undefined)
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}
