'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { validateOperationInput } from 'src/controllers/bot/schema'
import { parseDataFromOutputMapping } from 'src/utils/bot'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)

  try {
    validateOperationInput(event)

    const { inputData } = event

    const {
      // Required fields
      fromArray,
      arraySource,

      // Custom fields
      ...customFields
    } = inputData

    const data = fromArray
      ? parseDataFromOutputMapping(arraySource, customFields)
      : customFields

    api.httpOperationResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}
