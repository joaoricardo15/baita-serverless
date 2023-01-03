'use strict'

import vm from 'vm'
import { Api, BotStatus } from 'src/utils/api'
import { validateOperationInput } from 'src/controllers/bot/schema'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)

  try {
    validateOperationInput(event)

    const { inputData } = event

    const code = `${inputData.code}`

    const codeInput: any = {}

    for (const varName in inputData)
      if (varName !== 'code') codeInput[varName] = inputData[varName]

    const script = new vm.Script(code)

    vm.createContext(codeInput)

    script.runInContext(codeInput, { displayErrors: true, timeout: 5000 })

    const { output: data } = codeInput

    api.httpOperationResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}
