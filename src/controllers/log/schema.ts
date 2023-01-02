'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import { IBotLog, ILog } from 'src/models/log'
import { DataType } from 'src/models/service'
import { TaskStatus } from 'src/models/bot'

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

export const logSchema: JSONSchemaType<ILog> = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    status: {
      type: 'string',
      enum: Object.values(TaskStatus) as readonly TaskStatus[],
    },
    timestamp: {
      type: 'number',
    },
    inputData: dataSchema,
    outputData: dataSchema,
  },
  required: ['name', 'status', 'timestamp'],
}

export const botLogSchema: JSONSchemaType<IBotLog> = {
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

export const validateLog = (log: IBotLog) => {
  const validate = ajv.compile(botLogSchema)

  if (!validate(log)) throw ajv.errorsText(validate.errors)
}
