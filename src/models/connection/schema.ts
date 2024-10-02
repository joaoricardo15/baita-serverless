'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import { IAppConnection } from './interface'

const ajv = new Ajv()
addFormats(ajv)

const connectionSchema: JSONSchemaType<IAppConnection> = {
  type: 'object',
  properties: {
    appId: {
      type: 'string',
    },
    userId: {
      type: 'string',
    },
    connectionId: {
      type: ['string', 'number'],
    },
    name: {
      type: 'string',
    },
    email: {
      type: 'string',
      format: 'email',
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
  },
  required: ['appId', 'userId', 'connectionId', 'name', 'credentials'],
}

export const validateConnection = (connection: IAppConnection) => {
  const validate = ajv.compile(connectionSchema)

  if (!validate(connection))
    throw `Invalid Connection: ${ajv.errorsText(validate.errors)}`
}
