'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import {
  InputSource,
  IService,
  IVariable,
  ServiceName,
  ServiceType,
  VariableType,
} from 'src/models/service'
import {
  ConditionType,
  IBot,
  ITask,
  ITaskCondition,
  ITaskResult,
  TaskStatus,
} from 'src/models/bot'
import { IApp } from 'src/models/app'

const ajv = new Ajv()
addFormats(ajv)

export const appSchema: JSONSchemaType<IApp> = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    appId: {
      type: 'string',
    },
    config: {
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
    },
  },
  required: ['name', 'appId', 'config'],
}

export const variableSchema: JSONSchemaType<IVariable> = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: Object.keys(VariableType) as readonly VariableType[],
    },
    name: {
      type: 'string',
    },
    label: {
      type: 'string',
    },
    value: {
      type: 'null',
      nullable: true,
    },
    sampleValue: {
      type: 'null',
      nullable: true,
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

export const conditionSchema: JSONSchemaType<ITaskCondition> = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: Object.keys(ConditionType) as readonly ConditionType[],
    },
    name: {
      type: 'string',
    },
    label: {
      type: 'string',
    },
    value: {
      type: 'null',
      nullable: true,
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

export const serviceSchema: JSONSchemaType<IService> = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: Object.keys(ServiceType) as readonly ServiceType[],
    },
    name: {
      type: 'string',
      enum: Object.keys(ServiceName) as readonly ServiceName[],
    },
    label: {
      type: 'string',
    },
    config: {
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
          enum: Object.keys(InputSource) as readonly InputSource[],
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
                enum: Object.keys(InputSource) as readonly InputSource[],
              },
              fieldName: {
                type: 'string',
                nullable: true,
              },
              value: {
                type: 'string',
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
                enum: Object.keys(InputSource) as readonly InputSource[],
              },
              fieldName: {
                type: 'string',
                nullable: true,
              },
              value: {
                type: 'string',
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
                enum: Object.keys(InputSource) as readonly InputSource[],
              },
              fieldName: {
                type: 'string',
                nullable: true,
              },
              value: {
                type: 'string',
                nullable: true,
              },
            },
            required: ['source'],
          },
        },
      },
    },
  },
  required: ['type', 'name', 'label', 'config'],
}

export const taskResultSchema: JSONSchemaType<ITaskResult> = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: Object.keys(TaskStatus) as readonly TaskStatus[],
    },
    timestamp: {
      type: 'number',
    },
    inputData: {
      type: 'null',
      nullable: true,
    },
    outputData: {
      type: 'null',
      nullable: true,
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
      type: 'string',
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

export const botSchema: JSONSchemaType<IBot> = {
  type: 'object',
  properties: {
    botId: {
      type: 'string',
    },
    userId: {
      type: 'string',
    },
    apiId: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    active: {
      type: 'boolean',
    },
    triggerUrl: {
      type: 'string',
    },
    triggerSamples: {
      type: 'array',
      items: taskResultSchema,
    },
    tasks: {
      type: 'array',
      items: taskSchema,
    },
  },
  required: [
    'botId',
    'userId',
    'apiId',
    'name',
    'active',
    'triggerUrl',
    'triggerSamples',
    'tasks',
  ],
}

export function validateConnection(connection: IBot): void {
  const validate = ajv.compile(botSchema)

  if (!validate(connection)) throw ajv.errorsText(validate.errors)
}
