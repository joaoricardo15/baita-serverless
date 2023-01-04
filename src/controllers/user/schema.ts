'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import { IPost, IUser } from 'src/models/user'

const ajv = new Ajv()
addFormats(ajv)

const userSchema: JSONSchemaType<IUser> = {
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

const postsSchema: JSONSchemaType<IPost[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      date: {
        type: 'string',
      },
      author: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      body: {
        type: 'string',
      },
      image: {
        type: 'string',
        nullable: true,
      },
      url: {
        type: 'string',
        nullable: true,
      },
    },
    required: ['date', 'author', 'title', 'body'],
  },
}

export const validateUser = (user: IUser) => {
  const validate = ajv.compile(userSchema)

  if (!validate(user)) throw ajv.errorsText(validate.errors)
}

export const validatePosts = (post: IPost[]) => {
  const validate = ajv.compile(postsSchema)

  if (!validate(post)) throw ajv.errorsText(validate.errors)
}
