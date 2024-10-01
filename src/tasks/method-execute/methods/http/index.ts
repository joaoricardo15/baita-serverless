import Axios from 'axios'
import { ITaskExecutionInput } from 'src/models/bot/interface'
import { getDataFromPath, getMappedData } from 'src/utils/bot'

interface IHttpRequest {
  path: string
  method: string
  headers: { [key: string]: string }
  bodyParams: { [key: string]: string }
  queryParams: { [key: string]: string }
}

export const httpRequest = async (
  taskInput: ITaskExecutionInput<IHttpRequest>
) => {
  try {
    const { appConfig, serviceConfig, inputData } = taskInput

    const axiosInput = {
      url: appConfig.apiUrl + (inputData.path ? `/${inputData.path}` : ''),
      method: inputData.method,
      headers: inputData.headers,
      data: inputData.bodyParams,
      params: inputData.queryParams,
    }

    console.log(axiosInput)

    const response = await Axios(axiosInput)

    console.log(response.data)

    const initialData = getDataFromPath(response.data, serviceConfig.outputPath)

    console.log(initialData)

    const mappedData = getMappedData(initialData, serviceConfig.outputMapping)

    return mappedData
  } catch (err) {
    throw err.message || err
  }
}
