import Api, { ApiRequestStatus } from 'src/utils/api'
import { Connection } from 'src/controllers/app'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const connection = new Connection()

  try {
    const { userId } = event.pathParameters

    const data = await connection.getUserConnections(userId)

    api.httpResponse(callback, ApiRequestStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, ApiRequestStatus.fail, err)
  }
}
