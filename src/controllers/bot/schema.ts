'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import {
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
  ITaskResult,
  TaskStatus,
} from 'src/models/bot'
import { IApp, IAppConfig } from 'src/models/app'
import { IOperationInput } from 'src/models/operation'

const ajv = new Ajv()
addFormats(ajv)

export const appConfigSchema: JSONSchemaType<IAppConfig> = {
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

export const appSchema: JSONSchemaType<IApp> = {
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
    value: {
      anyOf: [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'object' },
      ],
    },
    sampleValue: {
      anyOf: [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'object' },
      ],
    },
    outputIndex: {
      type: 'number',
      nullable: true,
    },
    outputName: {
      type: 'string',
      nullable: true,
    },
    customFieldId: {
      type: 'number',
      nullable: true,
    },
    taskIndex: {
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

export const conditionSchema: JSONSchemaType<ICondition> = {
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
    value: {
      anyOf: [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'object' },
      ],
    },
    outputName: {
      type: 'string',
      nullable: true,
    },
    sampleValue: {
      type: 'string',
      nullable: true,
    },
    outputIndex: {
      type: 'number',
      nullable: true,
    },
  },
  required: ['type', 'name', 'label'],
}

export const serviceConfigSchema: JSONSchemaType<ISerivceConfig> = {
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
    inputSource: {
      type: 'string',
      enum: Object.values(InputSource) as readonly InputSource[],
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

export const serviceSchema: JSONSchemaType<IService> = {
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

export const taskResultSchema: JSONSchemaType<ITaskResult> = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: Object.values(TaskStatus) as readonly TaskStatus[],
    },
    timestamp: {
      type: 'number',
    },
    inputData: {
      anyOf: [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'object' },
      ],
    },
    outputData: {
      anyOf: [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'object' },
      ],
    },
  },
  required: ['status', 'timestamp'],
}

export const taskSchema: JSONSchemaType<ITask> = {
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
}

export const tasksSchema: JSONSchemaType<ITask[]> = {
  type: 'array',
  items: taskSchema,
}

export const operationInputSchema: JSONSchemaType<IOperationInput> = {
  type: 'object',
  properties: {
    userId: {
      type: 'string',
    },
    connectionId: {
      type: 'string',
    },
    inputData: {
      anyOf: [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'object' },
      ],
    },
    appConfig: appConfigSchema,
    serviceConfig: serviceConfigSchema,
  },
  required: ['userId', 'connectionId', 'appConfig', 'serviceConfig'],
}

export const validateTask = (task: ITask) => {
  const validate = ajv.compile(taskSchema)

  if (!validate(task)) throw ajv.errorsText(validate.errors)
}

export const validateTasks = (tasks: ITask[]) => {
  const validate = ajv.compile(tasksSchema)

  if (!validate(tasks)) throw ajv.errorsText(validate.errors)
}

export const validateOperationInput = (input: IOperationInput) => {
  const validate = ajv.compile(operationInputSchema)

  if (!validate(input)) throw ajv.errorsText(validate.errors)
}
