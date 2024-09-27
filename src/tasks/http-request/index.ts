'use strict'

import Axios from 'axios'
import { validateOperationInput } from 'src/models/bot/schema'
import { getDataFromPath, getMappedData } from 'src/utils/bot'
import { Api, BotStatus } from 'src/utils/api'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)

  try {
    validateOperationInput(event)

    const {
      appConfig: { apiUrl },
      serviceConfig: { outputPath, outputMapping },
      inputData: { path, method, headers, queryParams, bodyParams },
    } = event

    const axiosInput = {
      url: apiUrl + (path ? `/${path}` : ''),
      method,
      headers,
      data: bodyParams,
      params: queryParams,
    }

    console.log(axiosInput)

    const response = await Axios(axiosInput)

    console.log(response.data)

    const initialData = getDataFromPath(response.data, outputPath)

    console.log(initialData)

    const mappedData = getMappedData(initialData, outputMapping)

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
