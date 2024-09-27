'use strict'

import { IVariable, VariableType } from 'src/models/service/interface'

export const getDataFromPath = (data: any, outputPath?: string) => {
  /*
    data = [{ person: { age: '35' }]
    outputPath = '0.person.age'
    
    => 35
  */

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
  /*
    data = { 
      firstName: 'Baita',
      secondName: 'Help',
      hobbies: [{ name: 'reading' }]
    }
    outputMapping = {
        name: 'firstName',
        hobby: 'hobbies.0.name'
    }
    
    => { name: 'Baita', hobby: 'reading' }
  */

  let mappedData = {}
  const outputKeys = Object.keys(outputMapping)

  for (let i = 0; i < outputKeys.length; i++) {
    const outputKey = outputKeys[i]
    const outputValue = getDataFromPath(data, outputMapping[outputKey])
    mappedData = setObjectDataFromPath(mappedData, outputValue, outputKey)
  }

  return mappedData
}

export const getMappedData = (
  data: any,
  outputMapping?: {
    [key: string]: string
  }
) => {
  /*
    data = { personalInfo: { name: 'Baita' } }
    outputMapping = { name: 'personalInfo.name' }
    
    => { name: 'Baita' }
  */
  if (!outputMapping) return data

  return Array.isArray(data)
    ? data
        .map((item) => getDataFromMapping(item, outputMapping))
        .filter((item) => item)
    : getDataFromMapping(data, outputMapping)
}

export const setObjectDataFromPath = (
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

export const getTestDataFromService = (
  inputData: IVariable[],
  serviceFields?: IVariable[]
) => {
  let data = {}

  // Get all service fields
  if (serviceFields) {
    for (let j = 0; j < serviceFields.length; j++) {
      const serviceInputField = serviceFields[j]

      const { type, name, value, label, required } = serviceInputField

      if (type === VariableType.environment) {
        if (!((value as string) in process.env)) {
          throw Error(`Environment variable '${label}' does not exist.`)
        }

        data = setObjectDataFromPath(data, process.env[value as string], name)
      } else if (type === VariableType.constant) {
        if (!value) {
          throw Error(`Constant variable '${label}' has no value.`)
        }

        data = setObjectDataFromPath(data, value, name)
      } else {
        const inputDataField = inputData.find((x) => x.name === name)

        if (!inputDataField) {
          if (required) {
            throw Error(`Required input field '${label}' is missing.`)
          }
        } else {
          const { sampleValue } = inputDataField

          if (sampleValue === undefined) {
            if (required) {
              throw Error(`Required input field '${label}' is empty.`)
            }
          }

          data = setObjectDataFromPath(data, sampleValue, name)
        }
      }
    }
  }

  // Get all custom fields
  for (let i = 0; i < inputData.length; i++) {
    const inputDataField = inputData[i]

    if (inputDataField.customFieldId) {
      const { name, sampleValue } = inputDataField
  
      data = setObjectDataFromPath(data, sampleValue, name)
    }
  }

  return data
}
