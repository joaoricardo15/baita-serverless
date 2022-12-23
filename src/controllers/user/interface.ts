'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv()
addFormats(ajv)

export interface IUser {
  userId: string
  name: string
  email: string
  givenName: string
  familyName: string
  picture: string
  phone: string
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
    givenName: {
      type: 'string',
    },
    familyName: {
      type: 'string',
    },
    picture: {
      type: 'string',
    },
    phone: {
      type: 'string',
    },
  },
  required: ['userId', 'name', 'email'],
}

export function validateUser(user: IUser): void {
  const validate = ajv.compile(userSchema)

  if (!validate(user)) throw ajv.errorsText(validate.errors)
}
