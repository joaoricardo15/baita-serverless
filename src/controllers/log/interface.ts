'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv()
addFormats(ajv)

export interface ITaskLog {
  name: string
  status: string
  timestamp: number
  outputData?: any
}

export interface ILog {
  userId: string
  botId: string
  error?: any
  timestamp: number
  usage: number
  logs: Array<ITaskLog>
}

export interface ILogUsage {
  total: number
}

export const logSchema: JSONSchemaType<ILog> = {
  type: 'object',
  properties: {
    botId: {
      type: 'string',
    },
    userId: {
      type: 'string',
    },
    error: {
      type: 'null',
      nullable: true,
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

export function validateLog(connection: ILog): void {
  const validate = ajv.compile(logSchema)

  if (!validate(connection)) throw ajv.errorsText(validate.errors)
}
