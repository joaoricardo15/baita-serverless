'use strict'

import Axios from 'axios'
import { validateOperationInput } from 'src/models/bot/schema'
import { Api, BotStatus } from 'src/utils/api'
import {
  getObjectDataFromPath,
  parseDataFromOutputMapping,
} from 'src/utils/bot'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)

  try {
    validateOperationInput(event)

    const {
      inputData,
      appConfig: { apiUrl },
      serviceConfig: { method, outputPath, outputMapping },
    } = event

    const {
      // Required input fields
      path,
      headers,
      urlParams,
      bodyParams,
      queryParams,
    } = inputData

    console.log({
      url: parseUrlFromTask(apiUrl, path, urlParams),
      method: method,
      headers: headers,
      data: bodyParams,
      params: queryParams,
    })

    const response = await Axios({
      url: parseUrlFromTask(apiUrl, path, urlParams),
      method,
      headers,
      data: bodyParams,
      params: queryParams,
    })

    console.log(response.data)

    const initialData = getObjectDataFromPath(response.data, outputPath)

    const data = parseDataFromOutputMapping(initialData, outputMapping)

    api.httpOperationResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}

export const parseUrlFromTask = (
  url,
  path,
  urlParams?: { [key: string]: string }
) => {
  const initialUrl = `${url}/${path}`

  return !urlParams
    ? initialUrl
    : encodeURIComponent(
        Object.values(urlParams).reduce((p, c) => `${p}/${c}`, initialUrl)
      )
}
