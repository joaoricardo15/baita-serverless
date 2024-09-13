'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import {
  DataType,
  InputSource,
  IServiceConfig,
  IService,
  IVariable,
  ServiceName,
  ServiceType,
  VariableType,
} from 'src/models/service'
import {
  ITask,
  ITaskCondition,
  ITaskExecutionResult,
  ITaskExecutionInput,
  TaskExecutionStatus,
  ConditionOperator,
} from 'src/models/bot'
import { IApp, IAppConfig } from 'src/models/app'

const ajv = new Ajv()
addFormats(ajv)

const dataSchema: JSONSchemaType<DataType> = {
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

const appConfigSchema: JSONSchemaType<IAppConfig> = {
  type: 'object',
  properties: {
    apiUrl: {
      type: 'string',
      nullable: true,
    },
    loginUrl: {
      type: 'string',
      nullable: true,
    },
    authorizeUrl: {
      type: 'string',
      nullable: true,
    },
    auth: {
      type: 'object',
      nullable: true,
      properties: {
        type: {
          type: 'string',
        },
        method: {
          type: 'string',
        },
        url: {
          type: 'string',
        },
        headers: {
          type: 'object',
          nullable: true,
        },
        fields: {
          type: 'object',
          nullable: true,
          properties: {
            username: {
              type: 'string',
            },
            password: {
              type: 'string',
            },
          },
          required: ['username', 'password'],
        },
      },
      required: ['type', 'method', 'url'],
    },
  },
}

const appSchema: JSONSchemaType<IApp> = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    appId: {
      type: 'string',
    },
    config: appConfigSchema,
  },
  required: ['name', 'appId', 'config'],
}

const variableSchema: JSONSchemaType<IVariable> = {
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
    value: {
      ...dataSchema,
      nullable: true,
    },
    sampleValue: {
      ...dataSchema,
      nullable: true,
    },
    description: {
      type: 'string',
      nullable: true,
    },
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
    path: {
      type: 'string',
      nullable: true,
    },
    method: {
      type: 'string',
      nullable: true,
    },
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
    queryParams: {
      type: 'array',
      nullable: true,
      items: {
        type: 'object',
        properties: {
          paramName: {
            type: 'string',
          },
          source: {
            type: 'string',
            enum: Object.values(InputSource) as readonly InputSource[],
          },
          fieldName: {
            type: 'string',
            nullable: true,
          },
          value: {
            type: ['string', 'number'],
            nullable: true,
          },
        },
        required: ['paramName', 'source'],
      },
    },
    bodyParams: {
      type: 'array',
      nullable: true,
      items: {
        type: 'object',
        properties: {
          paramName: {
            type: 'string',
          },
          source: {
            type: 'string',
            enum: Object.values(InputSource) as readonly InputSource[],
          },
          fieldName: {
            type: 'string',
            nullable: true,
          },
          value: {
            type: ['string', 'number'],
            nullable: true,
          },
        },
        required: ['paramName', 'source'],
      },
    },
    urlParams: {
      type: 'array',
      nullable: true,
      items: {
        type: 'object',
        properties: {
          source: {
            type: 'string',
            enum: Object.values(InputSource) as readonly InputSource[],
          },
          fieldName: {
            type: 'string',
            nullable: true,
          },
          value: {
            type: ['string', 'number'],
            nullable: true,
          },
        },
        required: ['source'],
      },
    },
  },
}

const serviceSchema: JSONSchemaType<IService> = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: Object.values(ServiceType) as readonly ServiceType[],
    },
    name: {
      type: 'string',
      enum: Object.values(ServiceName) as readonly ServiceName[],
    },
    label: {
      type: 'string',
    },
    config: serviceConfigSchema,
  },
  required: ['type', 'name', 'label', 'config'],
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

const operationInputSchema: JSONSchemaType<ITaskExecutionInput> = {
  type: 'object',
  properties: {
    userId: {
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
  required: ['userId', 'appConfig', 'serviceConfig'],
}

export const validateTasks = (tasks: ITask[]) => {
  const validate = ajv.compile(tasksSchema)

  if (!validate(tasks)) throw ajv.errorsText(validate.errors)
}

export const validateTaskResult = (taskResult: ITaskExecutionResult) => {
  const validate = ajv.compile(taskResultSchema)

  if (!validate(taskResult)) throw ajv.errorsText(validate.errors)
}

export const validateOperationInput = (input: ITaskExecutionInput) => {
  const validate = ajv.compile(operationInputSchema)

  if (!validate(input)) throw ajv.errorsText(validate.errors)
}
