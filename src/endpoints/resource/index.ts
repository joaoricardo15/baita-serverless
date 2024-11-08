import Api, { ApiRequestStatus } from 'src/utils/api'
import Resource, { resourceOperations } from 'src/controllers/resource'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)

  try {
    const { userId, resourceName, operation, resourceId } = event.pathParameters

    const resource = new Resource(userId, resourceName)

    const body = JSON.parse(event.body)

    if (!resourceOperations.includes(operation)) {
      throw 'Operation not supported'
    }

    const data = await resource[operation](resourceId, body)

    console.log('data', data)

    api.httpResponse(callback, ApiRequestStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, ApiRequestStatus.fail, err)
  }
}
