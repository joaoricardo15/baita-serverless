'use strict'

import { IAppConfig } from 'src/models/app'
import { InputSource } from 'src/models/service'
import { IServiceConfig, IVariable } from 'src/models/service'

    => { id: '123', user: { name: 'john' } }
  */

  if (!inputPath) {
    return data
  }

  let currentData = data
  const paths = inputPath.split('.')

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

export const getBodyFromService = (
  appConfig: IAppConfig,
  serviceConfig: IServiceConfig,
  inputData: any
) => {
  /*
    data = { user: { name: 'john' } }
    outputPath = 'user.name'

  if (!bodyParams) return {}

  // const { auth = {} } = appConfig // TODO

  const data = {}
  for (let i = 0; i < bodyParams.length; i++) {
    const { paramName, source, value, fieldName = '' } = bodyParams[i]

    const fieldValue =
      source === InputSource.value
        ? value
        : // : source === InputSource.auth // TODO
        // ? auth[fieldName]
        source === InputSource.service
        ? serviceConfig[fieldName]
        : source === InputSource.input
        ? inputData[fieldName]
        : ''

    data[paramName] = fieldValue
  }

  return data
}

export const getUrlFromService = (
  appConfig: IAppConfig,
  serviceConfig: IServiceConfig,
  inputData: any
) => {
  // TODO
  const { apiUrl /*auth = {}*/ } = appConfig

  const { path, urlParams } = serviceConfig

  let url = `${apiUrl}${path}`

  if (urlParams) {
    url += '/'
    for (let i = 0; i < urlParams.length; i++) {
      const { source, fieldName = '', value } = urlParams[i]

      const fieldValue =
        source === InputSource.value
          ? value
          : // : source === InputSource.auth // TODO
          // ? auth[fieldName]
          source === InputSource.service
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
  serviceConfig: IServiceConfig,
  inputData: any
) => {
  const { queryParams } = serviceConfig

  // const { auth = {} } = appConfig // TODO

  const params = {}
  if (queryParams) {
    for (let i = 0; i < queryParams.length; i++) {
      const { paramName, source, fieldName = '', value } = queryParams[i]

      const fieldValue =
        source === InputSource.value
          ? value
          : // : source === InputSource.auth // TODO
          // ? auth[fieldName]
          source === InputSource.service
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
  serviceFields?: IVariable[],
  testData?: boolean
) => {
  let data = {}

  // Get all service fields
  if (serviceFields)
    for (let j = 0; j < serviceFields.length; j++) {
      const serviceInputField = serviceFields[j]

      const { type, name, value, label, required } = serviceInputField

      if (type === VariableType.environment) {
        if (!((serviceInputField.value as string) in process.env)) {
          throw Error(`Environment variable '${label}' does not exist.`)
        }

        data = setObjectDataFromPath(
          data,
          process.env[serviceInputField.value as string],
          serviceInputField.name
        )
      } else if (type === VariableType.constant) {
        if (!serviceInputField.value) {
          throw Error(`Constant variable '${label}' has no value.`)
        }

        data = setObjectDataFromPath(data, value, serviceInputField.name)
      } else {
        const inputDataField = inputData.find((x) => x.name === name)

        if (!inputDataField) {
          if (required) {
            throw Error(`Required input field '${label}' is missing.`)
          }
        } else {
          const { sampleValue, value, outputIndex } = inputDataField

          if (required) {
            if (testData) {
              if (sampleValue === undefined)
                throw Error(`Required input field '${label}' is empty.`)
            } else {
              if (outputIndex === undefined && value === undefined)
                throw Error(`Required input field '${label}' is empty.`)
            }
          }

          data = setObjectDataFromPath(
            data,
            getVariableValue(inputDataField, testData),
            inputDataField.name
          )
        }
      }
    }

  // Get all custom fields
  for (let i = 0; i < inputData.length; i++) {
    const inputDataField = inputData[i]

    if (inputDataField.customFieldId) {
      data = setObjectDataFromPath(
        data,
        getVariableValue(inputDataField, testData),
        inputDataField.name
      )
    }
  }

  return data
}
