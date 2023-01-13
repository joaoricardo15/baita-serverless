'use strict'

import { JSONSchemaType } from 'ajv'
import { DataType, IVariable, VariableType } from '../bot/interface'

import { ISerivceConfig, IService, ServiceName, ServiceType } from './interface'

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
