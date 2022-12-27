'use strict'

import Axios from 'axios'
import { Api, BotStatus } from 'src/utils/api'
import { Http } from 'src/utils/http'
import { Oauth2 } from 'src/utils/oauth2'
import { Connection } from 'src/controllers/connection'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const http = new Http()
  const oauth2 = new Oauth2()
  const connectionClient = new Connection()

  try {
    const { config, connection, inputData, outputPath } = event

    const {
      userId,
      connectionId,
      config: {
        auth: { url, type, method, headers, fields },
      },
    } = connection

    // Get credentials from connection database
    const {
      credentials: { refresh_token },
    } = await connectionClient.getConnection(userId, connectionId)

    // Get token from app's oauth2 authenticator server
    const {
      data: { access_token },
    } = await Axios({
      url,
      method,
      headers,
      auth: oauth2.getAuthFromParameters(type, fields),
      data: oauth2.getDataFromParameters(type, headers, fields, refresh_token),
    })

    // Http request
    const response = await Axios({
      method: config.method,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${access_token}`,
      },
      url: http.getUrlFromInputs(config, connection, inputData),
      data: http.getDataFromInputs(config, connection, inputData),
    })

    const data = http.getDataFromPath(response.data, outputPath)

    api.httpOperationResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}
