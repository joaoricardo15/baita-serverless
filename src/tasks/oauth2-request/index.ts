'use strict'

import Axios from 'axios'
import { validateOperationInput } from 'src/controllers/bot/schema'
import { Connection } from 'src/controllers/connection'
import { Api, BotStatus } from 'src/utils/api'
import {
  getAuthParamsFromApp,
  getBodyFromService,
  getAuthDataFromApp,
  getDataFromPath,
  getMappedData,
  getUrlFromService,
  getQueryParamsFromService,
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

    console.log({
      url,
      method,
      headers,
      auth: getAuthParamsFromApp(type, fields),
      data: getAuthDataFromApp(type, headers, fields, refresh_token),
    })

    // Get token from app's oauth2 authenticator server
    const {
      data: { access_token },
    } = await Axios({
      url,
      method,
      headers,
      auth: getAuthParamsFromApp(type, fields),
      data: getAuthDataFromApp(type, headers, fields, refresh_token),
    })

    const axiosInput = {
      method: serviceConfig.method,
      headers: {
        ...serviceConfig.headers,
        Authorization: `Bearer ${access_token}`,
      },
      url: getUrlFromService(appConfig, serviceConfig, inputData),
      data: getBodyFromService(appConfig, serviceConfig, inputData),
      params: getQueryParamsFromService(appConfig, serviceConfig, inputData),
    }

    console.log(axiosInput)

    // Http request
    const response = await Axios(axiosInput)

    console.log(response.data)

    const initialData = getDataFromPath(response.data, serviceConfig.outputPath)

    console.log(initialData)

    const mappedData = getMappedData(initialData, serviceConfig.outputMapping)

    api.httpOperationResponse(
      callback,
      BotStatus.success,
      undefined,
      mappedData
    )
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}
