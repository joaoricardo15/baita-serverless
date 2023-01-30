'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { App } from 'src/controllers/app'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const app = new App()

  try {
    const data = await app.getBotModels()

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
