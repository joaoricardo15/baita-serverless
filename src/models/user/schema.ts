'use strict'

import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import { IPost, ITodoTask, IUser } from './interface'

const ajv = new Ajv()
addFormats(ajv)

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

export const postsSchema: JSONSchemaType<IPost[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      body: {
        type: 'string',
      },
      date: {
        type: 'string',
      },
      header: {
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
    required: ['body', 'date', 'author'],
  },
}

export const todoTasksSchema: JSONSchemaType<ITodoTask[]> = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
      },
      body: {
        type: 'string',
        nullable: true,
      },

      done: {
        type: 'boolean',
      },
      createdAt: {
        type: 'number',
      },
      updatedAt: {
        type: 'number',
      },
    },
    required: ['title', 'done', 'createdAt', 'updatedAt'],
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

export const validateTodoTasks = (post: ITodoTask[]) => {
  const validate = ajv.compile(todoTasksSchema)

  if (!validate(post)) throw ajv.errorsText(validate.errors)
}
