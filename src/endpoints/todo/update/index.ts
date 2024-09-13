'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { User } from 'src/controllers/user'
import { validateTodoTasks } from 'src/models/user/schema'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const user = new User()

  try {
    const { userId } = event.pathParameters

    const tasks = JSON.parse(event.body)

    validateTodoTasks(tasks)

    const data = await user.updateTodo(userId, tasks)

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
