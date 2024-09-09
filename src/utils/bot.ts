'use strict'

import { IAppConfig } from 'src/models/app'
import { ISerivceConfig, IVariable } from 'src/models/service'
import { InputSource } from 'src/models/service'

export const getDataFromPath = (data: any, outputPath?: string) => {
  if (!outputPath) return data

  const paths = outputPath.split('.')

  for (let i = 0; i < paths.length; i++) {
    const key = paths[i]
    const intKey = parseInt(key)
    data = data[isNaN(intKey) ? key : intKey]
  }

  return data
}

export const getDataFromObject = (data: any, serviceConfig: ISerivceConfig) => {
  const { outputMapping } = serviceConfig

  if (!outputMapping || typeof data !== 'object') return data

  const mappedData = {}
  const outputKeys = Object.keys(outputMapping)

  for (let i = 0; i < outputKeys.length; i++) {
    const outputKey = outputKeys[i]
    const outputValue = getDataFromPath(data, outputMapping[outputKey])
    if (!outputValue) return
    mappedData[outputKey] = outputValue
  }

  return mappedData
}

export const getDataFromService = (
  data: any,
  serviceConfig: ISerivceConfig
) => {
  return Array.isArray(data)
    ? data
        .map((item) => getDataFromObject(item, serviceConfig))
        .filter((item) => item)
    : getDataFromObject(data, serviceConfig)
}

export const getBodyFromService = (
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

export const getUrlFromService = (
  appConfig: IAppConfig,
  serviceConfig: ISerivceConfig,
  inputData: any
) => {
  const { path, urlParams } = serviceConfig

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

  return url
}

export const getQueryParamsFromService = (
  appConfig: IAppConfig,
  serviceConfig: ISerivceConfig,
  inputData: any
) => {
  const { queryParams } = serviceConfig

  const { auth = {} } = appConfig

  const params = {}
  if (queryParams) {
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

      params[paramName] = fieldValue
    }
  }

  return params
}

export const getTestDataFromService = (
  inputData: IVariable[],
  serviceFields?: IVariable[]
) => {
  const input = {}

  if (serviceFields)
    for (let j = 0; j < serviceFields.length; j++) {
      const fieldName = serviceFields[j].name
      const inputField = inputData.find((x) => x.name === fieldName)
      if (!inputField) throw `Input field '${fieldName}' not found.`
      input[fieldName] = inputField.sampleValue
    }

  return input
}

export const getAuthParamsFromApp = (type: string, authFields) => {
  if (type === 'basic')
    return {
      username: process.env[authFields.username] || '',
      password: process.env[authFields.password] || '',
    }
}

export const getAuthDataFromApp = (
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
