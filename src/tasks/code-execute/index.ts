import vm from 'vm'
import Api from 'src/utils/api'
import {
  ITaskExecutionInput,
  TaskExecutionStatus,
} from 'src/models/bot/interface'
import { validateTaskExecutionInput } from 'src/models/bot/schema'
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

    const codeContext = { ...customFields, userId, botId, output: undefined }

    vm.createContext(codeContext)

    vm.runInContext(code, codeContext, { displayErrors: true, timeout: 5000 })

    api.taskExecutionResponse(
      callback,
      TaskExecutionStatus.success,
      undefined,
      codeContext.output
    )
  } catch (err) {
    api.taskExecutionResponse(callback, TaskExecutionStatus.fail, err)
  }
}
