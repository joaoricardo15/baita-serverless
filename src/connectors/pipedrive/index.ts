import Api, { ApiRequestStatus } from 'src/utils/api'
import { validateAppConnection } from 'src/models/app/schema'
import Resource from 'src/controllers/resource'
import Bot from 'src/controllers/bot'
import Pipedrive from './pipedrive'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const bot = new Bot()
  const pipedrive = new Pipedrive()

  try {
    const { code, state, error } = event.queryStringParameters

    if (error) {
      return api.httpConnectorResponse(callback, ApiRequestStatus.fail)
    }

    const { userId, appId, botId, taskIndex } =
      pipedrive.desconstructAuthState(state)

    const credentials = await pipedrive.getCredentials(code)

    const { connectionId, email } = await pipedrive.getConnectionInfo(
      credentials.api_domain,
      credentials.access_token
    )

    const newConnection = {
      userId,
      appId,
      connectionId,
      credentials,
      name: email,
      email,
    }

    validateAppConnection(newConnection)

    const resource = new Resource(userId, 'connection')

    await resource.create(connectionId, newConnection)

    await bot.addConnection(userId, botId, connectionId, taskIndex)

    api.httpConnectorResponse(callback, ApiRequestStatus.success)
  } catch (err) {
    api.httpConnectorResponse(callback, ApiRequestStatus.fail, err)
  }
}
