'use strict'

import { IVariable, VariableType } from 'src/models/bot/interface'

export const OUTPUT_SEPARATOR = '###'

const setObjectDataFromPath = (
  data: object,
  value: any,
  inputPath?: string
) => {
  /*
    data = { id: '123' }
    value = 'john'
    inputPath = 'user.name'

    => { id: '123', user: { name: 'john' } }
  */

  if (!inputPath) {
    return data
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
  /*
    data = { user: { name: 'john' } }
    outputMapping = { 'author.name': 'user.name' }

    => { author: { name: 'john' } }
  */

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

const getVariableInputPath = (field: IVariable) => {
  return field.groupName ? `${field.groupName}.${field.name}` : field.name
}

export const getVariableValue = (field: IVariable, testData?: boolean) => {
  /*
    field = { outputIndex: 0, outputPath: 'user.name' } }
    testData = false

    => '###task0_outputData['user']['name']###'
  */

  return testData
    ? field.sampleValue
    : field.outputIndex !== undefined && field.outputPath !== undefined
    ? OUTPUT_SEPARATOR +
      field.outputPath
        .split('.')
        .reduce(
          (p, c) => p + (c ? `['${c}']` : ''),
          `task${field.outputIndex}_outputData`
        ) +
      OUTPUT_SEPARATOR
    : field.value
}

export const getObjectDataFromPath = (data: object, outputPath?: string) => {
  /*
    data = { user: { name: 'john' } }
    outputPath = 'user.name'

    => 'john'
  */

  if (!outputPath) {
    return data
  }

  const paths = outputPath.split('.')

  for (let i = 0; i < paths.length; i++) {
    const key = paths[i]
    if (typeof key === 'string' && data[key] !== undefined) {
      data = data[key]
    } else if (typeof key === 'string' && key.includes('###')) {
      return key.split('###')[1]
    } else if (typeof key === 'number' || typeof key === 'object') {
      return key
    } else {
      return
    }
  }

  return data
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
  let data = {}

  // Get all service fields
  if (serviceFields)
    for (let j = 0; j < serviceFields.length; j++) {
      const serviceInputField = serviceFields[j]

      const { type, name, value, label, required } = serviceInputField

      if (type === VariableType.constant) {
        if (required && !serviceInputField.value) {
          throw Error(`Required service field '${label}' is missing.`)
        }

        data = setObjectDataFromPath(
          data,
          value,
          getVariableInputPath(serviceInputField)
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
            getVariableValue(inputDataField, testData),
            getVariableInputPath(inputDataField)
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
        getVariableInputPath(inputDataField)
      )
    }
  }

  return data
}
