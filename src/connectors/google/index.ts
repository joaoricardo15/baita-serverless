'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { Bot } from 'src/controllers/bot'
import { Connection } from 'src/controllers/connection'
import { Google } from './google'
import { validateConnection } from 'src/controllers/connection/schema'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const bot = new Bot()
  const google = new Google()
  const connection = new Connection()

  try {
    const { code, state, error } = event.queryStringParameters

    if (error) return api.httpConnectorResponse(callback, BotStatus.fail)

    const { userId, appId, botId, taskIndex } =
      google.desconstructAuthState(state)

    const credentials = await google.getCredentials(code)

    const { access_token } = credentials

    const { connectionId, email } = await google.getConnectionInfo(access_token)

    const newConnection = {
      userId,
      appId,
      connectionId,
      credentials,
      name: email,
      email,
    }

    validateConnection(newConnection)

    await connection.createConnection(newConnection)

    await bot.addConnection(userId, botId, connectionId, taskIndex)

    api.httpConnectorResponse(callback, BotStatus.success)
  } catch (err) {
    api.httpConnectorResponse(callback, BotStatus.fail, err)
  }
}
