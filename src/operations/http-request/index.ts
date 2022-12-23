'use strict'

import Axios from 'axios'
import { Api } from 'src/utils/api'
import { Http } from 'src/utils/http'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const http = new Http()

  try {
    const {
      config,
      inputData,
      outputPath,
      connection: {
        config: { apiUrl },
      },
    } = event

    const response = await Axios({
      method: config.method,
      headers: config.headers,
      url: http.getUrlFromParameters(apiUrl, config, inputData),
      data: http.getDataFromParameters(config, inputData),
    })

    const data = http.getOutputData(response.data, outputPath)

    api.httpOperationResponse(callback, 'success', undefined, data)
  } catch (err) {
    api.httpOperationResponse(callback, 'fail', err)
  }
}
