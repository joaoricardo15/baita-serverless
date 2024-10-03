import Api, { ApiRequestStatus } from 'src/utils/api'
import { validateTodoTasks } from 'src/models/user/schema'
import User from 'src/controllers/user'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const user = new User()

  try {
    const { userId } = event.pathParameters

    const tasks = JSON.parse(event.body)

    validateTodoTasks(tasks)

    const data = await user.updateTodo(userId, tasks)

    api.httpResponse(callback, ApiRequestStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, ApiRequestStatus.fail, err)
  }
}
