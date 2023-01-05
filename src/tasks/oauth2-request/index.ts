'use strict'

import Axios from 'axios'
import { validateOperationInput } from 'src/controllers/bot/schema'
import { Connection } from 'src/controllers/connection'
import { Api, BotStatus } from 'src/utils/api'
import {
  parseAuthParamsFromTask,
  parseBodyFromTask,
  parseAuthDataFromTask,
  getObjectDataFromPath,
  getDataFromService,
  parseUrlFromTask,
  parseQueryParamsFromTask,
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
      auth: parseAuthParamsFromTask(type, fields),
      data: parseAuthDataFromTask(type, headers, fields, refresh_token),
    })

    // Get token from app's oauth2 authenticator server
    const {
      data: { access_token },
    } = await Axios({
      url,
      method,
      headers,
      auth: parseAuthParamsFromTask(type, fields),
      data: parseAuthDataFromTask(type, headers, fields, refresh_token),
    })

    console.log({
      method: serviceConfig.method,
      headers: {
        ...serviceConfig.headers,
        Authorization: `Bearer ${access_token}`,
      },
      url: parseUrlFromTask(appConfig, serviceConfig, inputData),
      data: parseBodyFromTask(appConfig, serviceConfig, inputData),
      params: parseQueryParamsFromTask(appConfig, serviceConfig, inputData),
    })

    // Http request
    const response = await Axios({
      method: serviceConfig.method,
      headers: {
        ...serviceConfig.headers,
        Authorization: `Bearer ${access_token}`,
      },
      url: parseUrlFromTask(appConfig, serviceConfig, inputData),
      data: parseBodyFromTask(appConfig, serviceConfig, inputData),
      params: parseQueryParamsFromTask(appConfig, serviceConfig, inputData),
    })

    console.log(response.data)

    const initialData = getObjectDataFromPath(
      response.data,
      serviceConfig.outputPath
    )

    console.log(initialData)

    const mappedData = getDataFromService(initialData, serviceConfig)

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
