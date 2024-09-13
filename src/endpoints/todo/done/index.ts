'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { User } from 'src/controllers/user'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const user = new User()

  try {
    const { userId, taskId } = event.pathParameters

    const data = await user.doneTodo(userId, taskId)

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
