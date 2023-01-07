'use strict'

import { IVariable, VariableType } from 'src/models/service'

export const OUTPUT_SEPARATOR = '###'

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

const geObjectFromOutputMapping = (
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

export const parseDataFromOutputMapping = (
  data: any,
  outputMapping: { [key: string]: string }
) => {
  return Array.isArray(data)
    ? data
        .map((item) => geObjectFromOutputMapping(item, outputMapping))
        .filter((item) => item)
    : geObjectFromOutputMapping(data, outputMapping)
}

export const getInputDataFromService = (
  inputData: IVariable[],
  serviceFields?: IVariable[],
  testData?: boolean
) => {
  const getInputValue = (field: IVariable, testData?: boolean) =>
    testData
      ? field.sampleValue
      : field.outputIndex !== undefined
      ? `${field.outputIndex}${OUTPUT_SEPARATOR}${field.outputPath || ''}`
      : field.value

  const getInputPath = (field: IVariable) =>
    field.groupName ? `${field.groupName}.${field.name}` : field.name

  let data = {}

  // Get all service fields
  if (serviceFields)
    for (let j = 0; j < serviceFields.length; j++) {
      const serviceInputField = serviceFields[j]

      const { type, name, value, label, required } = serviceInputField

      if (type === VariableType.value) {
        if (required && !serviceInputField.value) {
          throw Error(`Required service field '${label}' is missing.`)
        }

        data = setObjectDataFromPath(
          data,
          value,
          getInputPath(serviceInputField)
        )
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
            getInputValue(inputDataField, testData),
            getInputPath(inputDataField)
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
        getInputValue(inputDataField, testData),
        getInputPath(inputDataField)
      )
    }
  }

  return data
}
