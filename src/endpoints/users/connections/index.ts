'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { Connection } from 'src/controllers/connection'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const connection = new Connection()

  try {
    const { userId } = event.pathParameters

    const data = await connection.getUserConnections(decodeURI(userId))

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
