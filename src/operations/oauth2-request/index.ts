'use strict'

import Axios from 'axios'
import { validateOperationInput } from 'src/controllers/bot/schema'
import { Connection } from 'src/controllers/connection'
import { Api, BotStatus } from 'src/utils/api'
import {
  getAuthFromParameters,
  getDataFromInputs,
  getDataFromParameters,
  getDataFromPath,
  getUrlFromInputs,
} from 'src/utils/bot'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
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
      auth: getAuthFromParameters(type, fields),
      data: getDataFromParameters(type, headers, fields, refresh_token),
    })

    // Http request
    const response = await Axios({
      method: serviceConfig.method,
      headers: {
        ...serviceConfig.headers,
        Authorization: `Bearer ${access_token}`,
      },
      url: getUrlFromInputs(appConfig, serviceConfig, inputData),
      data: getDataFromInputs(appConfig, serviceConfig, inputData),
    })

    const data = getDataFromPath(response.data, serviceConfig.outputPath)

    api.httpOperationResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}
