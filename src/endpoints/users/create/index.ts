'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { User } from 'src/controllers/user'
import { validateUser } from 'src/controllers/user/schema'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const user = new User()

  try {
    const body = JSON.parse(event.body)

    const newUser = { userId: body.user_id, ...body }

    validateUser(newUser)

    const data = await user.create(newUser)

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
