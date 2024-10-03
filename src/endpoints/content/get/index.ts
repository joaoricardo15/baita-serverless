import Api, { ApiRequestStatus } from 'src/utils/api'
import User from 'src/controllers/user'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const user = new User()

  try {
    const { userId } = event.pathParameters

    const data = await user.getContent(userId)

    api.httpResponse(callback, ApiRequestStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, ApiRequestStatus.fail, err)
  }
}
