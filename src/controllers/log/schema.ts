'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import { IBotLog, ILog } from 'src/models/log'

const ajv = new Ajv()
addFormats(ajv)

export const logSchema: JSONSchemaType<ILog> = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    status: {
      type: 'string',
    },
    timestamp: {
      type: 'number',
    },
    inputData: {
      type: 'object' || 'array' || 'string' || 'number' || 'boolean',
      nullable: true,
    },
    outputData: {
      type: 'object' || 'array' || 'string' || 'number' || 'boolean',
      nullable: true,
    },
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

export function validateLog(log: IBotLog): void {
  const validate = ajv.compile(botLogSchema)

  if (!validate(log)) throw ajv.errorsText(validate.errors)
}
