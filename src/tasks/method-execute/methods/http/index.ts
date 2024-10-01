import Axios from 'axios'
import { ITaskExecutionInput } from 'src/models/bot/interface'
import { getDataFromPath, getMappedData } from 'src/utils/bot'
import { Connection } from 'src/controllers/app'

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

export const oauth2Request = async (
  taskInput: ITaskExecutionInput<IHttpRequest>
) => {
  const connectionClient = new Connection()

  try {
    const { userId, appConfig, serviceConfig, inputData, connectionId } =
      taskInput

    if (!connectionId) {
      throw 'No connectionId'
    }

    if (!appConfig.auth) {
      throw 'No appConfig.auth'
    }

    // Get credentials from connection database
    const credentialsResponse = await connectionClient.getConnection(
      userId,
      connectionId
    )

    if (!credentialsResponse.credentials.refresh_token) {
      throw 'No refresh token'
    }

    const axiosAuthInput = {
      url: appConfig.auth.url,
      method: appConfig.auth.method,
      headers: appConfig.auth.headers,
      auth: getAuthParamsFromApp(appConfig.auth.type, appConfig.auth.fields),
      data: getAuthDataFromApp(
        appConfig.auth.type,
        appConfig.auth.fields,
        appConfig.auth.headers,
        credentialsResponse.credentials.refresh_token
      ),
    }

    console.log(axiosAuthInput)

    // // Get token from app's oauth2 authenticator server
    const authResponse = await Axios(axiosAuthInput)

    const axiosInput = {
      url: appConfig.apiUrl + (inputData.path ? `/${inputData.path}` : ''),
      method: inputData.method,
      headers: {
        ...inputData.headers,
        Authorization: `Bearer ${authResponse.data.access_token}`,
      },
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

const getAuthParamsFromApp = (authType: string, authFields) => {
  if (authType === 'basic')
    return {
      username: process.env[authFields.username] || '',
      password: process.env[authFields.password] || '',
    }
}

const getAuthDataFromApp = (
  authType: string,
  authFields,
  authHeaders,
  refreshToken
) => {
  let data
  if (
    authHeaders &&
    authHeaders['Content-type'] &&
    authHeaders['Content-type'] === 'application/x-www-form-urlencoded'
  ) {
    const rawData = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }

    if (authType === 'body') {
      rawData['client_id'] = process.env[authFields.username]
      rawData['client_secret'] = process.env[authFields.password]
    }

    data = new URLSearchParams(rawData)
  } else {
    data = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }

    if (authType === 'body') {
      data['client_id'] = process.env[authFields.username]
      data['client_secret'] = process.env[authFields.password]
    }
  }

  return data
}
