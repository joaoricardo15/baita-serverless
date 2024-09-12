'use strict'

import Axios from 'axios'
import { validateOperationInput } from 'src/controllers/bot/schema'
import { IServiceConfig } from 'src/models/service'
import { IAppConfig } from 'src/models/app'
import { Api, BotStatus } from 'src/utils/api'
import {
  getBodyFromService,
  getDataFromPath,
  getMappedData,
  getQueryParamsFromService,
  getUrlFromService,
} from 'src/utils/bot'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)

  try {
    validateOperationInput(event)

    const { appConfig, serviceConfig, inputData } = event as {
      appConfig: IAppConfig,
      serviceConfig: IServiceConfig,
      inputData: any
    }

    const axiosInput = {
      method: serviceConfig.method,
      // TODO delete
      // headers: serviceConfig.headers,
      url: getUrlFromService(appConfig, serviceConfig, inputData),
      data: getBodyFromService(appConfig, serviceConfig, inputData),
      params: getQueryParamsFromService(appConfig, serviceConfig, inputData),
    }

    console.log(axiosInput)

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
