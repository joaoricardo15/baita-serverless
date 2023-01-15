'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import { appConfigSchema, appSchema } from '../app/schema'
import { serviceConfigSchema, serviceSchema } from '../service/schema'
import {
  ConditionOperator,
  DataType,
  IBotLog,
  ILog,
  ITask,
  ITaskCondition,
  ITaskExecutionInput,
  ITaskExecutionResult,
  IVariable,
  TaskExecutionStatus,
  VariableType,
} from './interface'

const ajv = new Ajv()
addFormats(ajv)

export const dataSchema: JSONSchemaType<DataType> = {
  anyOf: [
    { type: 'string' },
    { type: 'number' },
    { type: 'boolean' },
    { type: 'object' },
    {
      type: 'array',
      items: {
        anyOf: [
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' },
          { type: 'object' },
        ],
      },
    },
  ],
}

export const variableSchema: JSONSchemaType<IVariable> = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: Object.values(VariableType) as readonly VariableType[],
    },
    name: {
      type: 'string',
    },
    label: {
      type: 'string',
    },
    value: dataSchema,
    sampleValue: dataSchema,
    required: {
      type: 'boolean',
      nullable: true,
    },
    outputIndex: {
      type: 'number',
      nullable: true,
    },
    outputPath: {
      type: 'string',
      nullable: true,
    },
    customFieldId: {
      type: 'number',
      nullable: true,
    },
    groupName: {
      type: 'string',
      nullable: true,
    },
    options: {
      type: 'array',
      nullable: true,
      items: {
        type: 'object',
        properties: {
          label: {
            type: 'string',
          },
          value: {
            type: 'string',
          },
        },
        required: ['label', 'value'],
      },
    },
  },
  required: ['type', 'name', 'label'],
}

const conditionSchema: JSONSchemaType<ITaskCondition> = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: Object.values(VariableType) as readonly VariableType[],
    },
    name: {
      type: 'string',
    },
    label: {
      type: 'string',
    },
    value: dataSchema,
    sampleValue: dataSchema,
    required: {
      type: 'boolean',
      nullable: true,
    },
    outputIndex: {
      type: 'number',
      nullable: true,
    },
    outputPath: {
      type: 'string',
      nullable: true,
    },
    customFieldId: {
      type: 'number',
      nullable: true,
    },
    groupName: {
      type: 'string',
      nullable: true,
    },
    options: {
      type: 'array',
      nullable: true,
      items: {
        type: 'object',
        properties: {
          label: {
            type: 'string',
          },
          value: {
            type: 'string',
          },
        },
        required: ['label', 'value'],
      },
    },
    conditionOperator: {
      type: 'string',
      nullable: true,
      enum: Object.values(ConditionOperator) as readonly ConditionOperator[],
    },
    conditionComparisonValue: dataSchema,
  },
  required: ['type', 'name', 'label'],
}

const taskResultSchema: JSONSchemaType<ITaskExecutionResult> = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: Object.values(
        TaskExecutionStatus
      ) as readonly TaskExecutionStatus[],
    },
    timestamp: {
      type: 'number',
    },
    inputData: dataSchema,
    outputData: dataSchema,
  },
  required: ['status', 'timestamp'],
}

const tasksSchema: JSONSchemaType<ITask[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      app: {
        nullable: true,
        ...appSchema,
      },
      service: {
        nullable: true,
        ...serviceSchema,
      },
      taskId: {
        type: 'number',
      },
      connectionId: {
        type: 'string',
        nullable: true,
      },
      inputData: {
        type: 'array',
        items: variableSchema,
      },
      sampleResult: {
        nullable: true,
        ...taskResultSchema,
      },
      returnData: {
        type: 'boolean',
        nullable: true,
      },
      conditions: {
        type: 'array',
        nullable: true,
        items: {
          type: 'array',
          items: conditionSchema,
        },
      },
    },
    required: ['taskId', 'inputData'],
  },
}

const operationInputSchema: JSONSchemaType<ITaskExecutionInput<DataType>> = {
  type: 'object',
  properties: {
    userId: {
      type: 'string',
    },
    botId: {
      type: 'string',
    },
    connectionId: {
      type: 'string',
      nullable: true,
    },
    inputData: dataSchema,
    appConfig: appConfigSchema,
    serviceConfig: serviceConfigSchema,
  },
  required: ['userId', 'botId', 'appConfig', 'serviceConfig'],
}

const logSchema: JSONSchemaType<ILog> = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    status: {
      type: 'string',
      enum: Object.values(
        TaskExecutionStatus
      ) as readonly TaskExecutionStatus[],
    },
    timestamp: {
      type: 'number',
    },
    inputData: dataSchema,
    outputData: dataSchema,
  },
  required: ['name', 'status', 'timestamp'],
}

const botLogSchema: JSONSchemaType<IBotLog> = {
  type: 'object',
  properties: {
    botId: {
      type: 'string',
    },
    userId: {
      type: 'string',
    },
    timestamp: {
      type: 'number',
    },
    usage: {
      type: 'number',
    },
    logs: {
      type: 'array',
      items: logSchema,
    },
  },
  required: ['botId', 'userId', 'timestamp', 'usage', 'logs'],
}

export const validateTasks = (tasks: ITask[]) => {
  const validate = ajv.compile(tasksSchema)

  if (!validate(tasks)) throw ajv.errorsText(validate.errors)
}

export const validateTaskResult = (taskResult: ITaskExecutionResult) => {
  const validate = ajv.compile(taskResultSchema)

  if (!validate(taskResult)) throw ajv.errorsText(validate.errors)
}

export const validateLog = (log: IBotLog) => {
  const validate = ajv.compile(botLogSchema)

  if (!validate(log)) throw ajv.errorsText(validate.errors)
}

export const validateOperationInput = (
  input: ITaskExecutionInput<DataType>
) => {
  const validate = ajv.compile(operationInputSchema)

  if (!validate(input)) throw ajv.errorsText(validate.errors)
}
