'use strict'

import { IVariable, VariableType } from 'src/models/service/interface'

export const OUTPUT_CODE = '###baita.help###'

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
    outputMapping = { 'person.name': 'personalInfo.name' }
    
    => { person: { name: 'Baita' } }
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

export const getValueFromServiceVariable = (variable: IVariable) => {
  const { label, value, type } = variable

  // Is it a constant variable?
  if (type === VariableType.constant) {
    if (value === undefined) {
      throw Error(`Constant variable '${label}' has no value`)
    }

    return value
  }

  // Is it an environment variable?
  if (type === VariableType.environment) {
    if (process.env[value as string] === undefined) {
      throw Error(`Environment variable '${label}' does not exist`)
    }

    return process.env[value as string]
  }

  return
}

export const getValueFromInputVariable = (
  variable: IVariable,
  testData: boolean
) => {
  const { label, value, sampleValue, type, outputIndex, outputPath } = variable

  // Is it a test case?
  if (testData) {
    if (sampleValue === undefined) {
      throw Error(`Variable '${label}' has no sample value`)
    }

    return sampleValue
  }

  // If not, is it an output variable?
  if (type === VariableType.output) {
    if (outputIndex === undefined || outputPath === undefined) {
      throw Error(`Variable '${label}' has no outputIndex or outputPath`)
    }

    return (
      OUTPUT_CODE +
      getOutputVariableString(outputIndex, outputPath)
    )
  }

  return value
}

export const getOutputVariableString = (index: number, path: string) =>
  `task${index}_outputData${path
    .split('.')
    .map((x) => x && (!isNaN(Number(x)) ? `[${x}]` : `[\`${x}\`]`))
    .join('')}`

export const getDataFromService = (
  serviceFields: IVariable[],
  inputData: IVariable[],
  testData: boolean = false
) => {
  let data = {}

  // Loop over all service fields
  for (let j = 0; j < serviceFields.length; j++) {
    const serviceVariable = serviceFields[j]
    const serviceVariableValue = getValueFromServiceVariable(serviceVariable)

    // If there is no value in the service variable
    if (serviceVariableValue == undefined) {
      // Let's find a corresponding input variable
      const inputVariable = inputData.find(
        (x) => x.name === serviceVariable.name
      )

      // If there is no corresponding input variable
      if (inputVariable === undefined) {
        // And it is a required variable
        if (serviceVariable.required) {
          throw Error(
            `Required input field '${serviceVariable.label}' is missing`
          )
        }
      }
      // If there is a corresponding input variable
      else {
        const inputVariableValue = getValueFromInputVariable(
          inputVariable,
          testData
        )

        if (inputVariableValue === undefined) {
          if (serviceVariable.required) {
            throw Error(
              `Required input field '${serviceVariable.label}' has no value`
            )
          }
        }

        data = setObjectDataFromPath(
          data,
          inputVariableValue,
          serviceVariable.name
        )
      }
    }
    // If there is value in the service variable
    else {
      data = setObjectDataFromPath(
        data,
        serviceVariableValue,
        serviceVariable.name
      )
    }
  }

  // Get all custom fields
  for (let i = 0; i < inputData.length; i++) {
    const inputDataField = inputData[i]

    if (inputDataField.customFieldId) {
      const inputDataVariableValue = getValueFromInputVariable(
        inputDataField,
        testData
      )
  
      data = setObjectDataFromPath(
        data,
        inputDataVariableValue,
        inputDataField.name
      )
    }
  }

  return data
}
