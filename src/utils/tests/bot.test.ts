import { InputSource } from 'src/models/service'
import { getDataFromPath, getDataFromMapping, getMappedData, getBodyFromService } from '../bot'

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
  test('should return undefined if property is not found', () => {
    const data = { firstName: 'Baita' }
    const outputMapping = { name: 'firstName', age: 'age' }
    expect(getDataFromMapping(data, outputMapping)).toBeUndefined()
  })

  test('should return mapped object - empty mapping', () => {
    const data = { firstName: 'Baita', age: 35 }
    const outputMapping = {}
    expect(getDataFromMapping(data, outputMapping)).toStrictEqual({})
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
      { name: 'Help' },
    ])
  })
})

describe('getBodyFromService', () => {
  test('should return an empty object when there is no bodyParams', () => {
    const appService = {}
    const serviceConfig = {}
    const inputData = {}
    expect(getBodyFromService(appService, serviceConfig, inputData)).toStrictEqual({})
  })

  test('should return object with constant value when source is value', () => {
    const appService = {}
    const serviceConfig = { bodyParams: [{ paramName: 'language', source: InputSource.value, value: 'en' }] }
    const inputData = {}
    expect(getBodyFromService(appService, serviceConfig, inputData)).toStrictEqual({ language: 'en' })
  })
})
