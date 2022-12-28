'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import { IBotLog } from 'src/models/log'

const ajv = new Ajv()
addFormats(ajv)

export const logSchema: JSONSchemaType<IBotLog> = {
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
      items: {
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
            type: 'null',
            nullable: true,
          },
          outputData: {
            type: 'null',
            nullable: true,
          },
        },
        required: ['name', 'status', 'timestamp'],
      },
    },
  },
  required: ['botId', 'userId', 'timestamp', 'usage', 'logs'],
}

export function validateLog(log: IBotLog): void {
  const validate = ajv.compile(logSchema)

  if (!validate(log)) throw ajv.errorsText(validate.errors)
}
