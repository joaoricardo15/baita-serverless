'use strict'

import { ConditionType, ITaskCondition } from 'src/models/bot'
import { IVariable, VariableType } from 'src/models/service'

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
    if (key in data) {
      data = data[key]
    } else {
      return null
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

const comparationExpressions = {
  equals: '==',
  diferent: '!=',
  exists: '',
  donotexists: '',
}

export const getConditionsString = (conditions?: ITaskCondition[]) => {
  let andConditionsString = ''

  if (conditions)
    for (let j = 0; j < conditions.length; j++) {
      const andConditions = conditions[j].andConditions

      if (andConditions) {
        for (let k = 0; k < andConditions.length; k++) {
          const andCondition = andConditions[k]

          let conditionValue = ''
          if (andCondition.outputIndex !== undefined) {
            conditionValue = `task${andCondition.outputIndex}_outputData['${andCondition.name}']`
          } else if (andCondition.value) {
            conditionValue = `\`${andCondition.value}\``
          }

          const conditionExpression = comparationExpressions[andCondition.type]

          const comparationValue = andCondition.type

          if (conditionValue && andCondition.type)
            andConditionsString += `${k === 0 ? '' : ' && '}${
              andCondition.type === ConditionType.donotexists
                ? `!${conditionValue}`
                : andCondition.type === ConditionType.exists
                ? `${conditionValue}`
                : `${conditionValue} ${conditionExpression} ${comparationValue}`
            }`
        }
      }

      if (andConditionsString) {
        andConditionsString += `${
          j === 0 ? '' : ' || '
        }(${andConditionsString})`
      }
    }

  return andConditionsString
}
