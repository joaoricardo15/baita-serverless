'use strict'

import { IAppConfig } from 'src/models/app'
import { InputSource, ISerivceConfig, IVariable } from 'src/models/service'

export const getObjectDataFromPath = (data: object, outputPath?: string) => {
  if (!outputPath) {
    return data
  }

  const paths = outputPath.split('.')

  for (let i = 0; i < paths.length; i++) {
    const key = paths[i]
    if (key in data) {
      data = data[key]
    } else {
      return null
    }
  }

  return data
}

const setObjectDataFromPath = (
  data: object,
  value: any,
  inputPath?: string
) => {
  if (!inputPath) {
    return value
  }

  let currentData = data
  const paths = inputPath.split('.')

  for (let i = 0; i < paths.length; i++) {
    const key = paths[i]

    if (i === paths.length - 1) {
      currentData[key] = value
    } else if (!(key in currentData)) {
      const nextIntKey = parseInt(paths[i + 1])
      if (isNaN(nextIntKey)) {
        currentData[key] = {}
      } else {
        currentData[key] = []
      }
    }

    currentData = currentData[key]
  }

  return data
}

const getDataFromServiceMapping = (
  data: any,
  outputMapping?: { [key: string]: string }
) => {
  if (!outputMapping || typeof data !== 'object') return data

  let mappedData = {}
  const inputPaths = Object.keys(outputMapping)

  for (let i = 0; i < inputPaths.length; i++) {
    const inputPath = inputPaths[i]

    mappedData = setObjectDataFromPath(
      mappedData,
      getObjectDataFromPath(data, outputMapping[inputPath]),
      inputPath
    )
  }

  return mappedData
}

export const getDataFromService = (
  data: any,
  serviceConfig: ISerivceConfig
) => {
  return Array.isArray(data)
    ? data
        .map((item) =>
          getDataFromServiceMapping(item, serviceConfig.outputMapping)
        )
        .filter((item) => item)
    : getDataFromServiceMapping(data, serviceConfig.outputMapping)
}

export const getTestDataFromService = (
  inputData: IVariable[],
  serviceFields?: IVariable[]
) => {
  const data = {}

  // Get all servcie fields
  if (serviceFields)
    for (let j = 0; j < serviceFields.length; j++) {
      const { name, label, required } = serviceFields[j]
      const serviceInputField = inputData.find((x) => x.name === name)

      if (required && (!serviceInputField || !serviceInputField.sampleValue)) {
        throw Error(`Required input field '${label}' is missing.`)
      }

      data[name] = serviceInputField?.sampleValue || ''
    }

  // Get all custom fields
  for (let i = 0; i < inputData.length; i++) {
    const { name, sampleValue, customFieldId } = inputData[i]
    if (customFieldId) {
      data[name] = sampleValue || ''
    }
  }

  return data
}

export const parseBodyFromTask = (
  appConfig: IAppConfig,
  serviceConfig: ISerivceConfig,
  inputData: any
) => {
  const { bodyParams } = serviceConfig

  const { auth = {} } = appConfig

  let data = {}
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

      data = setObjectDataFromPath(data, fieldValue, paramName)
    }
  }

  return data
}

export const parseUrlFromTask = (
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

export const parseQueryParamsFromTask = (
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

export const parseAuthParamsFromTask = (type: string, authFields) => {
  if (type === 'basic')
    return {
      username: process.env[authFields.username] || '',
      password: process.env[authFields.password] || '',
    }
}

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
