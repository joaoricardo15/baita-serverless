import { VariableType } from 'src/models/service'
import { getConditionsString, getInputString } from '../code'
import { ConditionOperator } from 'src/models/bot'

describe('getInputString', () => {
  test('should return an empty string when there is no service fields', () => {
    const inputData = []
    expect(getInputString(inputData)).toBe('')
    expect(getInputString(inputData, [])).toBe('')
  })

  test('should throw error when field is not found', () => {
    const inputData = []
    const serviceFields = [
      {
        name: 'language',
        label: 'Language',
        type: VariableType.constant,
      },
    ]
    try {
      expect(getInputString(inputData, serviceFields)).toThrow(
        'Input field language not found.'
      )
    } catch (e) {
      console.log(e)
    }
  })

  test('should return simple param when outputIndex and outputPath are undefined', () => {
    const inputData = [
      {
        name: 'language',
        label: 'Input Language',
        type: VariableType.constant,
        value: 'input_language_value',
      },
    ]
    const serviceFields = [
      {
        name: 'language',
        label: 'Service Language',
        type: VariableType.constant,
      },
    ]

    expect(getInputString(inputData, serviceFields)).toBe(
      "'language': `input_language_value`,"
    )
  })

  test('should return entire task outputData when outputIndex is defined and outputPath is defined but empty', () => {
    const inputData = [
      {
        name: 'language',
        label: 'Input Language',
        type: VariableType.output,
        value: 'input_language_value',
        outputIndex: 0,
        outputPath: '',
      },
    ]
    const serviceFields = [
      {
        name: 'language',
        label: 'Service Language',
        type: VariableType.constant,
        value: 'service_language_value',
      },
    ]

    expect(getInputString(inputData, serviceFields)).toBe(
      "'language': task0_outputData,"
    )
  })

  test('should return mapped task outputData when outputIndex is defined and outputPath has properties', () => {
    const inputData = [
      {
        name: 'language',
        label: 'Input Language',
        type: VariableType.output,
        value: 'input_language_value',
        outputIndex: 0,
        outputPath: 'data.0.name',
      },
    ]
    const serviceFields = [
      {
        name: 'language',
        label: 'Service Language',
        type: VariableType.constant,
        value: 'service_language_value',
      },
    ]

    expect(getInputString(inputData, serviceFields)).toBe(
      "'language': task0_outputData[`data`][0][`name`],"
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
    expect(getConditionsString(conditions)).toBe('(`` == ``)')
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
      '(!!task2_outputData[`person`][`name`])'
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
      '(!!task1_outputData[`person`][`name`] && !!task2_outputData[`person`][`name`])'
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
      '(!!task1_outputData[`person`][`name`] && !!task2_outputData[`person`][`name`]) || (!!task3_outputData[`person`][`name`] && !!task4_outputData[`person`][`name`])'
    )
  })
})
