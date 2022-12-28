'use strict'

import Axios from 'axios'
import { Api, BotStatus } from 'src/utils/api'
import { Http } from 'src/utils/http'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const http = new Http()

  try {
    const { appConfig, serviceConfig, inputData, outputPath } = event

    const response = await Axios({
      method: serviceConfig.method,
      headers: serviceConfig.headers,
      url: http.getUrlFromInputs(appConfig, serviceConfig, inputData),
      data: http.getDataFromInputs(appConfig, serviceConfig, inputData),
    })

    const data = http.getDataFromPath(response.data, outputPath)

    api.httpOperationResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}
