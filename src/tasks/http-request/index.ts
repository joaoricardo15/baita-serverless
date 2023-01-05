'use strict'

import Axios from 'axios'
import { validateOperationInput } from 'src/controllers/bot/schema'
import { Api, BotStatus } from 'src/utils/api'
import {
  parseBodyFromTask,
  getObjectDataFromPath,
  getDataFromService,
  parseQueryParamsFromTask,
  parseUrlFromTask,
} from 'src/utils/bot'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)

  try {
    validateOperationInput(event)

    const { appConfig, serviceConfig, inputData } = event

    console.log({
      method: serviceConfig.method,
      headers: serviceConfig.headers,
      url: parseUrlFromTask(appConfig, serviceConfig, inputData),
      data: parseBodyFromTask(appConfig, serviceConfig, inputData),
      params: parseQueryParamsFromTask(appConfig, serviceConfig, inputData),
    })

    const response = await Axios({
      method: serviceConfig.method,
      headers: serviceConfig.headers,
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
