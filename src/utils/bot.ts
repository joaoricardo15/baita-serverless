'use strict'

import { IAppConfig } from 'src/models/app'
import { ITask } from 'src/models/bot'
import { InputSource, ISerivceConfig } from 'src/models/service'

export const getAuthFromParameters = (type: string, authFields) => {
  if (type === 'basic')
    return {
      username: process.env[authFields.username] || '',
      password: process.env[authFields.password] || '',
    }
}

export const getDataFromPath = (data: any, path: string) => {
  if (!path) return data

  const paths = path.split('.')

  try {
    for (let i = 0; i < paths.length; i++) {
      const [type, value] = paths[i].split(':')
      data = data[type === 'number' ? parseInt(value) : value]
    }
    return data
  } catch (err) {
    return {}
  }
}

export const getUrlFromInputs = (
  appConfig: IAppConfig,
  serviceConfig: ISerivceConfig,
  inputData: any
) => {
  const { path, urlParams, queryParams } = serviceConfig

  const { apiUrl, auth = {} } = appConfig

  let url = `${apiUrl}${path}`

  if (urlParams) {
    url += '/'
    for (let i = 0; i < urlParams.length; i++) {
      const { source, fieldName = '', value } = urlParams[i]

      const fieldValue =
        source === InputSource.value
          ? value
          : source === InputSource.auth
          ? auth[fieldName]
          : source === InputSource.service
          ? serviceConfig[fieldName]
          : source === InputSource.input
          ? inputData[fieldName]
          : ''

      const encodedSource = encodeURIComponent(fieldValue).replace(
        /[!'()*]/g,
        (c) => '%' + c.charCodeAt(0).toString(16)
      )

      url += `${encodedSource}/`
    }
  }

  if (queryParams) {
    url += '?'
    for (let i = 0; i < queryParams.length; i++) {
      const { paramName, source, fieldName = '', value } = queryParams[i]

      const fieldValue =
        source === InputSource.value
          ? value
          : source === InputSource.auth
          ? auth[fieldName]
          : source === InputSource.service
          ? serviceConfig[fieldName]
          : source === InputSource.input
          ? inputData[fieldName]
          : ''

      const encodedSource = encodeURIComponent(fieldValue).replace(
        /[!'()*]/g,
        (c) => '%' + c.charCodeAt(0).toString(16)
      )

      url += `${paramName}=${encodedSource}&`
    }
  }

  return url
}

export const getDataFromInputs = (
  appConfig: IAppConfig,
  serviceConfig: ISerivceConfig,
  inputData: any
) => {
  const { bodyParams } = serviceConfig

  const { auth = {} } = appConfig

  const data = {}
  if (bodyParams) {
    for (let i = 0; i < bodyParams.length; i++) {
      const { paramName, source, fieldName = '', value } = bodyParams[i]

      const fieldValue =
        source === InputSource.value
          ? value
          : source === InputSource.auth
          ? auth[fieldName]
          : source === InputSource.service
          ? serviceConfig[fieldName]
          : source === InputSource.input
          ? inputData[fieldName]
          : ''

      data[paramName] = fieldValue
    }
  }

  return data
}

export const getDataFromParameters = (
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

export const getTestInput = (task: ITask) => {
  const input = {}

  if (
    task.service?.config.inputFields &&
    task.service.config.inputSource === InputSource.service
  )
    for (let j = 0; j < task.service.config.inputFields.length; j++) {
      const name = task.service.config.inputFields[j].name
      const inputField = task.inputData.find((x) => x.name === name)
      if (!inputField) throw 'Invalid bot config'
      input[inputField.name] = inputField.sampleValue
    }
  else if (task.service?.config.inputSource === InputSource.input)
    for (let j = 0; j < task.inputData.length; j++) {
      const inputField = task.inputData[j]
      input[inputField.name] = inputField.sampleValue
    }

  return input
}
