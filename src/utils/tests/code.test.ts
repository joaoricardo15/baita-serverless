import { VariableType } from 'src/models/service/interface'
import {
  getConditionsString,
  getInputString,
  getStringifiedVariableValue,
} from '../code'
import { ConditionOperator } from 'src/models/bot/interface'

describe('getStringifiedVariableValue', () => {
  test('should return string number for number value', () => {
    const value = 10
    expect(getStringifiedVariableValue(value)).toBe('10')
  })

  test('should return string boolean for boolean value', () => {
    const value = true
    expect(getStringifiedVariableValue(value)).toBe('true')
  })

  test('should return quoted string for string value', () => {
    const value = 'baita'
    expect(getStringifiedVariableValue(value)).toBe('`baita`')
  })

  test('should return string output variable name for output value', () => {
    const value = '###baita.help###task123_outputData["baita"]'
    expect(getStringifiedVariableValue(value)).toBe(
      'task123_outputData["baita"]'
    )
  })

  test('should return string output variable name for output value', () => {
    const value = {
      person: {
        age: 35,
        dev: true,
        name: 'baita',
        output: '###baita.help###task123_outputData["baita"]',
      },
    }
    expect(getStringifiedVariableValue(value)).toBe(
      '{ "person": { "age": 35, "dev": true, "name": `baita`, "output": task123_outputData["baita"] } }'
    )
  })
})

describe('getInputString', () => {
  test('should return an empty string when there is no properties', () => {
    const input = {}
    expect(getInputString(input)).toStrictEqual('')
  })

  test('should return simple param ', () => {
    const input = {
      type: 'human',
      person: {
        age: 35,
        dev: true,
        name: 'baita',
        output: '###baita.help###task123_outputData["baita"]',
      },
    }

    expect(getInputString(input)).toBe(
      '"type": `human`, "person": { "age": 35, "dev": true, "name": `baita`, "output": task123_outputData["baita"] }'
    )
  })
})

describe('getConditionsString', () => {
  test('should return an empty string when there is no conditions', () => {
    const conditions = [[]]
    expect(getConditionsString(conditions)).toBe('()')
  })

  test('should return an comparison between two empty strings', () => {
    const conditions = [
      [
        {
          operator: ConditionOperator.equals,
          operand: { type: VariableType.text, name: '', label: '' },
          comparisonOperand: { type: VariableType.text, name: '', label: '' },
        },
      ],
    ]
    expect(getConditionsString(conditions)).toBe('("" == "")')
  })

  test('should return an comparison between two strings', () => {
    const conditions = [
      [
        {
          operator: ConditionOperator.notEquals,
          operand: {
            type: VariableType.text,
            value: 'baita',
            name: '',
            label: '',
          },
          comparisonOperand: {
            type: VariableType.text,
            value: 'help',
            name: '',
            label: '',
          },
        },
      ],
    ]
    expect(getConditionsString(conditions)).toBe('(`baita` != `help`)')
  })

  test('should return a check if string a includes string b', () => {
    const conditions = [
      [
        {
          operator: ConditionOperator.contains,
          operand: {
            type: VariableType.text,
            value: 'baita',
            name: '',
            label: '',
          },
          comparisonOperand: {
            type: VariableType.text,
            value: 'help',
            name: '',
            label: '',
          },
        },
      ],
    ]
    expect(getConditionsString(conditions)).toBe('(`baita`.includes(`help`))')
  })

  test('should return a check if output exists', () => {
    const conditions = [
      [
        {
          operator: ConditionOperator.exists,
          operand: {
            name: '',
            label: '',
            type: VariableType.output,
            outputIndex: 2,
            outputPath: 'person.name',
          },
        },
      ],
    ]
    expect(getConditionsString(conditions)).toBe(
      '(!!task2_outputData["person"]["name"])'
    )
  })

  test('should return a check if output exists', () => {
    const conditions = [
      [
        {
          operator: ConditionOperator.exists,
          operand: {
            name: '',
            label: '',
            type: VariableType.output,
            outputIndex: 1,
            outputPath: 'person.name',
          },
        },
        {
          operator: ConditionOperator.exists,
          operand: {
            name: '',
            label: '',
            type: VariableType.output,
            outputIndex: 2,
            outputPath: 'person.name',
          },
        },
      ],
    ]
    expect(getConditionsString(conditions)).toBe(
      '(!!task1_outputData["person"]["name"] && !!task2_outputData["person"]["name"])'
    )
  })

  test('should return a check if output exists', () => {
    const conditions = [
      [
        {
          operator: ConditionOperator.exists,
          operand: {
            name: '',
            label: '',
            type: VariableType.output,
            outputIndex: 1,
            outputPath: 'person.name',
          },
        },
        {
          operator: ConditionOperator.exists,
          operand: {
            name: '',
            label: '',
            type: VariableType.output,
            outputIndex: 2,
            outputPath: 'person.name',
          },
        },
      ],
      [
        {
          operator: ConditionOperator.exists,
          operand: {
            name: '',
            label: '',
            type: VariableType.output,
            outputIndex: 3,
            outputPath: 'person.name',
          },
        },
        {
          operator: ConditionOperator.exists,
          operand: {
            name: '',
            label: '',
            type: VariableType.output,
            outputIndex: 4,
            outputPath: 'person.name',
          },
        },
      ],
    ]
    expect(getConditionsString(conditions)).toBe(
      '(!!task1_outputData["person"]["name"] && !!task2_outputData["person"]["name"]) || (!!task3_outputData["person"]["name"] && !!task4_outputData["person"]["name"])'
    )
  })
})
