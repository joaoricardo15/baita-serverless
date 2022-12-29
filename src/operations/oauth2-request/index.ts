'use strict'

import Axios from 'axios'
import { validateOperationInput } from 'src/controllers/bot/schema'
import { Connection } from 'src/controllers/connection'
import { Api, BotStatus } from 'src/utils/api'
import { Oauth2 } from 'src/utils/oauth2'
import { Http } from 'src/utils/http'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const http = new Http()
  const oauth2 = new Oauth2()
  const connectionClient = new Connection()

  try {
    validateOperationInput(event)

    const { userId, connectionId, appConfig, serviceConfig, inputData } = event

    const {
      auth: { url, type, method, headers, fields },
    } = appConfig

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
      method: serviceConfig.method,
      headers: {
        ...serviceConfig.headers,
        Authorization: `Bearer ${access_token}`,
      },
      url: http.getUrlFromInputs(appConfig, serviceConfig, inputData),
      data: http.getDataFromInputs(appConfig, serviceConfig, inputData),
    })

    const data = http.getDataFromPath(response.data, serviceConfig.outputPath)

    api.httpOperationResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}
