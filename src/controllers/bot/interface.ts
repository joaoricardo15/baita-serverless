'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv()
addFormats(ajv)

export interface IBot {
  userId: string
  botId: string
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
  },
  required: ['botId', 'userId'],
}

export function validateConnection(connection: IBot): void {
  const validate = ajv.compile(botSchema)

  if (!validate(connection)) throw ajv.errorsText(validate.errors)
}
