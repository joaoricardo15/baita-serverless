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
      body: {
        type: 'string',
      },
      date: {
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
      likes: {
        type: 'number',
        nullable: true,
      },
      comments: {
        type: 'number',
        nullable: true,
      },
      author: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          accountName: {
            type: 'string',
            nullable: true,
          },
          descripion: {
            type: 'string',
            nullable: true,
          },
          image: {
            type: 'string',
            nullable: true,
          },
          url: {
            type: 'string',
            nullable: true,
          },
          location: {
            type: 'string',
            nullable: true,
          },
          followers: {
            type: 'number',
            nullable: true,
          },
        },
        required: ['name'],
      },
    },
    required: ['title', 'body', 'date', 'author'],
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
