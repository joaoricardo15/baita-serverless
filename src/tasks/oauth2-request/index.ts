'use strict'

import Axios from 'axios'
import { validateOperationInput } from 'src/models/bot/schema'
import { Connection } from 'src/controllers/app'
import { Api, BotStatus } from 'src/utils/api'
import {
  getObjectDataFromPath,
  parseDataFromOutputMapping,
} from 'src/utils/bot'
import { parseUrlFromTask } from '../http-request'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const connectionClient = new Connection()

  try {
    validateOperationInput(event)

    const {
      userId,
      inputData,
      connectionId,
      appConfig: {
        apiUrl,
        auth: {
          url: authUrl,
          type: authType,
          method: authMethod,
          headers: authHeader,
          fields: authFields,
        },
      },
      serviceConfig: { path, method, headers, outputPath, outputMapping },
    } = event

    const {
      // Required fields
      urlParams,
      bodyParams,
      queryParams,

      // Custom fields
      ...customFields
    } = inputData

    // Get credentials from connection database
    const {
      credentials: { refresh_token },
    } = await connectionClient.getConnection(userId, connectionId)

    console.log({
      url: authUrl,
      method: authMethod,
      headers: authHeader,
      auth: parseAuthParamsFromTask(authFields),
      data: parseAuthDataFromTask(
        authType,
        authHeader,
        authFields,
        refresh_token
      ),
    })

    // Get token from app's oauth2 authenticator server
    const {
      data: { access_token },
    } = await Axios({
      url: authUrl,
      method: authMethod,
      headers: authHeader,
      auth: parseAuthParamsFromTask(authFields),
      data: parseAuthDataFromTask(
        authType,
        authHeader,
        authFields,
        refresh_token
      ),
    })

    console.log({
      url: parseUrlFromTask(apiUrl, path, urlParams),
      method,
      headers: {
        ...headers,
        Authorization: `Bearer ${access_token}`,
      },
      data: bodyParams,
      params: queryParams,
    })

    // Http request
    const response = await Axios({
      url: parseUrlFromTask(apiUrl, path, urlParams),
      method,
      headers: {
        ...headers,
        Authorization: `Bearer ${access_token}`,
      },
      data: bodyParams,
      params: queryParams,
    })

    console.log(response.data)

    const initialData = getObjectDataFromPath(response.data, outputPath)

    const data = parseDataFromOutputMapping(initialData, outputMapping)

    api.httpOperationResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpOperationResponse(callback, BotStatus.fail, err)
  }
}

export const parseAuthParamsFromTask = (authFields: {
  username: string
  password: string
}) => ({
  username: process.env[authFields.username] || '',
  password: process.env[authFields.password] || '',
})

export const parseAuthDataFromTask = (
  type: string,
  headers,
  authFields,
  refreshToken
) => {
  let data
  if (
    headers &&
    headers['Content-type'] &&
    headers['Content-type'] === 'application/x-www-form-urlencoded'
  ) {
    const rawData = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }

    if (type === 'body') {
      rawData['client_id'] = process.env[authFields.username]
      rawData['client_secret'] = process.env[authFields.password]
    }

    data = new URLSearchParams(rawData)
  } else {
    data = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }

    if (type === 'body') {
      data['client_id'] = process.env[authFields.username]
      data['client_secret'] = process.env[authFields.password]
    }
  }

  return data
}
