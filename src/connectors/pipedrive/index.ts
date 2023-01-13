'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { validateAppConnection } from 'src/models/app/schema'
import { Connection } from 'src/controllers/app'
import { Bot } from 'src/controllers/bot'
import { Pipedrive } from './pipedrive'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const bot = new Bot()
  const pipedrive = new Pipedrive()
  const connection = new Connection()

  try {
    const { code, state, error } = event.queryStringParameters

    if (error) return api.httpConnectorResponse(callback, BotStatus.fail)

    const { userId, appId, botId, taskIndex } =
      pipedrive.desconstructAuthState(state)

    const credentials = await pipedrive.getCredentials(code)

    const { api_domain, access_token } = credentials

    const { connectionId, email } = await pipedrive.getConnectionInfo(
      api_domain,
      access_token
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

    await connection.createConnection(newConnection)

    await bot.addConnection(userId, botId, connectionId, taskIndex)

    api.httpConnectorResponse(callback, BotStatus.success)
  } catch (err) {
    api.httpConnectorResponse(callback, BotStatus.fail, err)
  }
}
