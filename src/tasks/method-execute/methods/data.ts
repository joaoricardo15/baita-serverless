import { ITaskExecutionInput } from 'src/models/bot/interface'
import { parseDataFromOutputMapping } from 'src/utils/bot'

export const mapData = async (
  taskInput: ITaskExecutionInput<{ fromArray: boolean; arraySource: any[] }>
) => {
  try {
    const { inputData } = taskInput

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

    return data
  } catch (err) {
    throw err.message
  }
}
