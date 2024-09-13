'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { User } from 'src/controllers/user'
import { validateUser } from 'src/models/user/schema'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const user = new User()

  try {
    const body = JSON.parse(event.body)

    // This is a workaround for Auth0's user_id format
    const newUser = { userId: body.user_id.split('|')[1], ...body }

    validateUser(newUser)

    const data = await user.createUser(newUser)

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
