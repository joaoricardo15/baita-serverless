'use strict'

import Axios from 'axios'
import { validateOperationInput } from 'src/controllers/bot/schema'
import { Api, BotStatus } from 'src/utils/api'
import {
  getDataFromInputs,
  getDataFromPath,
  getUrlFromInputs,
} from 'src/utils/bot'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)

  try {
    validateOperationInput(event)

    const { appConfig, serviceConfig, inputData } = event

    const response = await Axios({
      method: serviceConfig.method,
      headers: serviceConfig.headers,
      url: getUrlFromInputs(appConfig, serviceConfig, inputData),
      data: getDataFromInputs(appConfig, serviceConfig, inputData),
    })

    const data = getDataFromPath(response.data, serviceConfig.outputPath)

    api.httpOperationResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}
