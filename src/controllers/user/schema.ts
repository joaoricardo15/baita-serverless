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
      title: {
        type: 'string',
      },
      description: {
        type: 'string',
      },
      author: {
        type: 'string',
      },
      image: {
        type: 'string',
      },
      date: {
        type: 'string',
      },
      url: {
        type: 'string',
      },
    },
    required: ['title', 'description', 'author', 'image', 'date', 'url'],
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
