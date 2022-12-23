'use strict'

import { Api } from 'src/utils/api'
import { Connection } from 'src/controllers/connection'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const connection = new Connection()

  try {
    const { userId } = event.pathParameters

    const data = await connection.getUserConnections(userId)

    api.httpResponse(callback, 'success', undefined, data)
  } catch (err) {
    api.httpResponse(callback, 'fail', err)
  }
}
