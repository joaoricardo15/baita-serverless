'use strict'

import vm from 'vm'
import { Api, BotStatus } from 'src/utils/api'
import { validateTaskExecutionInput } from 'src/models/bot/schema'
import { ITaskExecutionInput } from 'src/models/bot/interface'
import { DataType } from 'src/models/service/interface'

interface ICodeExecute {
  code: string
  [key: string]: DataType
}

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)

  try {
    validateTaskExecutionInput(event)

    const { userId, botId, inputData } =
      event as ITaskExecutionInput<ICodeExecute>

    const {
      // Required input fields
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
