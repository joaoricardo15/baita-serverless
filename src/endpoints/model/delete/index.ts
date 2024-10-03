import Api, { ApiRequestStatus } from 'src/utils/api'
import { App } from 'src/controllers/app'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const app = new App()

  try {
    const { modelId } = event.pathParameters

    const data = await app.deleteBotModel(modelId)

    api.httpResponse(callback, ApiRequestStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, ApiRequestStatus.fail, err)
  }
}
