'use strict'

import { IVariable } from "src/models/service/interface"

export const getDataFromPath = (data: any, outputPath?: string) => {
  if (!outputPath) return data

  const paths = outputPath.split('.')

  for (let i = 0; i < paths.length; i++) {
    const key = isNaN(Number(paths[i])) ? paths[i] : Number(paths[i])

    if (!data || typeof data !== 'object' || !Object.hasOwn(data, key)) return

    data = data[key]
  }

  return data
}

export const getDataFromMapping = (
  data: any,
  outputMapping: {
    [key: string]: string
  }
) => {
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

export const getMappedData = (
  data: any,
  outputMapping?: {
    [key: string]: string
  }
) => {
  if (!outputMapping) return data

  return Array.isArray(data)
    ? data
        .map((item) => getDataFromMapping(item, outputMapping))
        .filter((item) => item)
    : getDataFromMapping(data, outputMapping)
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
