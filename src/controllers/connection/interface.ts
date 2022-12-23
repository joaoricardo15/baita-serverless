'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv()
addFormats(ajv)

export interface ICredential {
  refresh_token?: string
  access_token?: string
}

export interface IConnection {
  userId: string
  connectionId: string
  appId: string
  credentials: ICredential
  name: string
  email?: string
  userName?: string
}

export const connectionSchema: JSONSchemaType<IConnection> = {
  type: 'object',
  properties: {
    userId: {
      type: 'string',
    },
    connectionId: {
      type: 'string',
    },
    appId: {
      type: 'string',
    },
    credentials: {
      type: 'object',
      properties: {
        refresh_token: {
          type: 'string',
          nullable: true,
        },
        access_token: {
          type: 'string',
          nullable: true,
        },
      },
      required: [],
    },
    name: {
      type: 'string',
    },
    email: {
      type: 'string',
      format: 'email',
      nullable: true,
    },
    userName: {
      type: 'string',
      nullable: true,
    },
  },
  required: ['userId', 'connectionId', 'appId', 'credentials', 'name'],
}

export function validateConnection(connection: IConnection): void {
  const validate = ajv.compile(connectionSchema)

  if (!validate(connection)) throw ajv.errorsText(validate.errors)
}
