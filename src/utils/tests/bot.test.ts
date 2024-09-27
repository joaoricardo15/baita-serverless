import { VariableType } from 'src/models/service/interface'
import {
  getDataFromPath,
  getDataFromMapping,
  getMappedData,
  setObjectDataFromPath,
  getTestDataFromService,
} from '../bot'

describe('getDataFromPath', () => {
  test('should return data when there is no output path', () => {
    const data = { id: '123' }
    expect(getDataFromPath(data)).toStrictEqual(data)
    expect(getDataFromPath(data, '')).toStrictEqual(data)
  })

  test('should return undefined when property does not exist', () => {
    const path = 'person.name'
    expect(getDataFromPath({ person: { age: '35' } }, path)).toBeUndefined()
    expect(getDataFromPath({ age: '35' }, path)).toBeUndefined()
    expect(getDataFromPath(undefined, path)).toBeUndefined()
    expect(getDataFromPath(null, path)).toBeUndefined()
    expect(getDataFromPath('', path)).toBeUndefined()
    expect(getDataFromPath(1, path)).toBeUndefined()
  })

  test('should return property corresponding to output path - simple object', () => {
    const data = { id: '123' }
    const path = 'id'
    expect(getDataFromPath(data, path)).toEqual('123')
  })

  test('should return property corresponding to output path - nested object', () => {
    const data = { person: { age: '35' } }
    const path = 'person.age'
    expect(getDataFromPath(data, path)).toEqual('35')
  })

  test('should return property corresponding to output path - simple array', () => {
    const data = [10, 20, 30]
    const path = '2'
    expect(getDataFromPath(data, path)).toEqual(30)
  })

  test('should return property corresponding to output path - comple object with array', () => {
    const data = [
      {
        person: {
          hobbies: [
            { name: 'reading', freq: 2 },
            { name: 'running', freq: 4 },
          ],
        },
      },
    ]
    const path = '0.person.hobbies.1'
    expect(getDataFromPath(data, path)).toStrictEqual({
      name: 'running',
      freq: 4,
    })
  })
})

describe('getDataFromObject', () => {
  test('should return an empty object for an empty mapping', () => {
    const data = { firstName: 'Baita', age: 35 }
    const outputMapping = {}
    expect(getDataFromMapping(data, outputMapping)).toStrictEqual({})
  })

  test('should return object with undefined values if property in the mapping is not found', () => {
    const data = { firstName: 'Baita', age: 'age' }
    const outputMapping = { name: 'name' }
    expect(getDataFromMapping(data, outputMapping)).toStrictEqual({
      name: undefined,
    })
  })

  test('should return mapped object - simple mapping', () => {
    const data = { firstName: 'Baita', secondName: 'Help', age: 35 }
    const outputMapping = { name: 'firstName' }
    expect(getDataFromMapping(data, outputMapping)).toStrictEqual({
      name: 'Baita',
    })
  })

  test('should return mapped object - complex mapping', () => {
    const data = {
      personalInfo: { firstName: 'Baita', secondName: 'Help', age: 35 },
      hobbies: [{ name: 'reading', freq: 4 }],
    }
    const outputMapping = {
      name: 'personalInfo.firstName',
      hobby: 'hobbies.0.name',
    }
    expect(getDataFromMapping(data, outputMapping)).toStrictEqual({
      name: 'Baita',
      hobby: 'reading',
    })
  })
})

describe('getDataFromService', () => {
  test('should return data when there is no outputMapping', () => {
    const data = { id: '123' }
    expect(getMappedData(data)).toStrictEqual(data)
  })

  test('should return mapped object when data is object', () => {
    const data = { personalInfo: { name: 'Baita' } }
    const outputMapping = { name: 'personalInfo.name' }
    expect(getMappedData(data, outputMapping)).toStrictEqual({
      name: 'Baita',
    })
  })

  test('should return mapped object when data is object', () => {
    const data = [
      { personalInfo: { firstName: 'Baita' } },
      { personalInfo: { firstName: 'Help' } },
      { otherObject: { otherProperty: '' } },
    ]
    const outputMapping = { name: 'personalInfo.firstName' }
    expect(getMappedData(data, outputMapping)).toStrictEqual([
      {
        name: 'Baita',
      },
      {
        name: 'Help',
      },
      {
        name: undefined,
      },
    ])
  })

  test('should return mapped object when data is object', () => {
    const data = {
      personalInfo: { firstName: 'Baita' },
      demographicInfo: { age: 35 },
      geographicIngo: { city: 'Help' },
    }
    const outputMapping = {
      'person.name': 'personalInfo.firstName',
      'person.age': 'demographicInfo.age',
      city: 'geographicIngo.city',
    }
    expect(getMappedData(data, outputMapping)).toStrictEqual({
      person: { name: 'Baita', age: 35 },
      city: 'Help',
    })
  })
})

describe('setObjectDataFromPath', () => {
  test('should return data when there is no inputPath', () => {
    const data = { person: { id: '123' } }
    expect(setObjectDataFromPath(data, null)).toStrictEqual({
      person: { id: '123' },
    })
  })

  test('should return the updated data with an extra property placed accordinly as specified on inputPath and value', () => {
    const data = { person: { id: '123' } }
    const value = 'Baita'
    const inputPath = 'person.name'
    expect(setObjectDataFromPath(data, value, inputPath)).toStrictEqual({
      person: { id: '123', name: 'Baita' },
    })
  })
})

describe('getTestDataFromService', () => {
  test('should return sample values when there are only custom input variables', () => {
    const inputData = [
      {
        name: 'method',
        label: 'Method',
        type: VariableType.constant,
        customFieldId: 123,
        sampleValue: 'sampleMethod',
      },
      {
        name: 'path',
        label: 'Path',
        type: VariableType.text,
        customFieldId: 456,
        sampleValue: 'samplePath',
      },
    ]

    expect(getTestDataFromService(inputData)).toStrictEqual({
      method: 'sampleMethod',
      path: 'samplePath',
    })
  })

  test('should return both sample values, enviroment and constant values when there are service variables plus custom input variables', () => {
    const inputData = [
      {
        name: 'inputProperty',
        label: 'InputProperty',
        type: VariableType.text,
        sampleValue: 'inputPropertyValue',
      },
      {
        name: 'inputCustomProperty',
        label: 'InputCustomProperty',
        type: VariableType.text,
        sampleValue: 'inputCustomPropertyValue',
        customFieldId: 123,
      },
    ]

    process.env['envPropertyName'] = 'testPropertyValue'
    const serviceVariables = [
      {
        name: 'envProperty',
        label: 'EnvProperty',
        value: 'envPropertyName',
        type: VariableType.environment,
      },
      {
        name: 'constProperty',
        label: 'ConstProperty',
        value: 'constPropertyValue',
        type: VariableType.constant,
      },
      {
        name: 'inputProperty',
        label: 'InputProperty',
        type: VariableType.user,
        required: true,
      },
    ]

    expect(getTestDataFromService(inputData, serviceVariables)).toStrictEqual({
      envProperty: 'testPropertyValue',
      constProperty: 'constPropertyValue',
      inputProperty: 'inputPropertyValue',
      inputCustomProperty: 'inputCustomPropertyValue',
    })
  })
})
