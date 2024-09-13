'use strict'

import { User } from 'src/controllers/user'
import { validateContent } from 'src/models/user/schema'
import { validateOperationInput } from 'src/models/bot/schema'
import { Api, BotStatus } from 'src/utils/api'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const user = new User()

  try {
    validateOperationInput(event)

    const {
      userId,
      inputData: { posts },
    } = event

    if (Array.isArray(posts)) {
      validateContent(posts)
      await user.publishContent(userId, posts)
    } else {
      validateContent([posts])
      await user.publishContent(userId, [posts])
    }

    api.httpOperationResponse(callback, BotStatus.success, undefined, {
      message: 'Content published successfully.',
    })
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}
