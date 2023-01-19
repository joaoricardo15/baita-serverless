'use strict'

import vm from 'vm'
import { Api, BotStatus } from 'src/utils/api'
import { validateOperationInput } from 'src/models/bot/schema'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)

  try {
    validateOperationInput(event)

    const { userId, botId, inputData } = event

    const {
      // Required fields
      code,

      // Custom fields
      ...customFields
    } = inputData

    const codeContext: any = { ...customFields, userId, botId }

    vm.createContext(codeContext)

    vm.runInContext(code, codeContext, { displayErrors: true, timeout: 5000 })

    const { output: data } = codeContext

    api.httpOperationResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}
