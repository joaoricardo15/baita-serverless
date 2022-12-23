'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv()
addFormats(ajv)

export interface IUser {
  userId: string
  name: string
  email: string
}

export const userSchema: JSONSchemaType<IUser> = {
  type: 'object',
  properties: {
    userId: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    email: {
      type: 'string',
      format: 'email',
    },
  },
  required: ['userId', 'name', 'email'],
}

export function validateUser(user: IUser): void {
  const validate = ajv.compile(userSchema)

  if (!validate(user)) throw ajv.errorsText(validate.errors)
}
