'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import {
  DataType,
  InputSource,
  ISerivceConfig,
  IService,
  IVariable,
  ServiceName,
  ServiceType,
  VariableType,
} from 'src/models/service'
import {
  ConditionType,
  ITask,
  ICondition,
  ITaskExecutionResult,
  TaskExecutionStatus,
  ITaskExecutionInput,
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

const conditionSchema: JSONSchemaType<ICondition> = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: Object.values(ConditionType) as readonly ConditionType[],
    },
    name: {
      type: 'string',
    },
    label: {
      type: 'string',
    },
    value: dataSchema,
    sampleValue: dataSchema,
    outputIndex: {
      type: 'number',
      nullable: true,
    },
  },
  required: ['type', 'name', 'label'],
}

const serviceConfigSchema: JSONSchemaType<ISerivceConfig> = {
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
          type: 'object',
          properties: {
            conditionId: {
              type: 'number',
            },
            andConditions: {
              type: 'array',
              nullable: true,
              items: conditionSchema,
            },
            orConditions: {
              type: 'array',
              nullable: true,
              items: conditionSchema,
            },
          },
          required: ['conditionId'],
        },
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
    inputData: dataSchema,
    appConfig: appConfigSchema,
    serviceConfig: serviceConfigSchema,
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
