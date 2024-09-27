'use strict'

import Axios from 'axios'
import { validateOperationInput } from 'src/models/bot/schema'
import { Connection } from 'src/controllers/connection'
import { Api, BotStatus } from 'src/utils/api'
import { getDataFromPath, getMappedData } from 'src/utils/bot'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const connectionClient = new Connection()

  try {
    validateOperationInput(event)

    const {
      userId,
      connectionId,
      appConfig: {
        apiUrl,
        auth: {
          url: authUrl,
          method: authMethod,
          headers: authHeaders,
          type: authType,
          fields: authFields,
        },
      },
      serviceConfig: { outputPath, outputMapping },
      inputData: { path, method, headers, queryParams, bodyParams },
    } = event

    // Get credentials from connection database
    const {
      credentials: { refresh_token },
    } = await connectionClient.getConnection(userId, connectionId)

    const axiosAuthInput = {
      url: authUrl,
      method: authMethod,
      headers: authHeaders,
      auth: getAuthParamsFromApp(authType, authFields),
      data: getAuthDataFromApp(
        authType,
        authFields,
        authHeaders,
        refresh_token
      ),
    }

    console.log(axiosAuthInput)

    // // Get token from app's oauth2 authenticator server
    const {
      data: { access_token },
    } = await Axios(axiosAuthInput)

    const axiosInput = {
      url: apiUrl + (path ? `/${path}` : ''),
      method,
      headers: {
        ...headers,
        Authorization: `Bearer ${access_token}`,
      },
      data: bodyParams,
      params: queryParams,
    }

    console.log(axiosInput)

    // Http request
    const response = await Axios(axiosInput)

    console.log(response.data)

    const initialData = getDataFromPath(response.data, outputPath)

    console.log(initialData)

    const mappedData = getMappedData(initialData, outputMapping)

    api.httpOperationResponse(
      callback,
      BotStatus.success,
      undefined,
      mappedData
    )
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
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
