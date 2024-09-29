'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import { appConfigSchema, appSchema } from '../app/schema'
import { dataSchema, serviceSchema, variableSchema } from '../service/schema'
import {
  DataType,
  IServiceConfig,
} from 'src/models/service/interface'
import {
  ITask,
  ITaskCondition,
  ITaskExecutionResult,
  ITaskExecutionInput,
  TaskExecutionStatus,
  ConditionOperator,
  ILog,
  IBotLog,
} from 'src/models/bot/interface'

const ajv = new Ajv()
addFormats(ajv)

const taskConditionSchema: JSONSchemaType<ITaskCondition> = {
  type: 'object',
  properties: {
    operator: {
      type: 'string',
      enum: Object.values(ConditionOperator) as readonly ConditionOperator[],
    },
    operand: variableSchema,
    comparisonOperand: {
      nullable: true,
      ...variableSchema,
    },
  },
  required: ['operator', 'operand'],
}

const serviceConfigSchema: JSONSchemaType<IServiceConfig> = {
  type: 'object',
  properties: {
    customFields: {
      type: 'boolean',
      nullable: true,
    },
    inputFields: {
      type: 'array',
      nullable: true,
      items: variableSchema,
    },
    outputPath: {
      type: 'string',
      nullable: true,
    },
    outputMapping: {
      type: 'object',
      nullable: true,
      required: [],
    },
  },
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
      taskId: {
        type: 'number',
      },
      app: {
        nullable: true,
        ...appSchema,
      },
      service: {
        nullable: true,
        ...serviceSchema,
      },
      returnData: {
        type: 'boolean',
        nullable: true,
      },
      connectionId: {
        type: 'string',
        nullable: true,
      },
      inputData: {
        type: 'array',
        items: variableSchema,
      },
      conditions: {
        type: 'array',
        nullable: true,
        items: {
          type: 'array',
          items: taskConditionSchema,
        },
      },
      sampleResult: {
        nullable: true,
        ...taskResultSchema,
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
    appConfig: appConfigSchema,
    serviceConfig: serviceConfigSchema,
    inputData: dataSchema,
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
