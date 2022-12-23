'use strict'

import { Api } from 'src/utils/api'
import { User } from 'src/controllers/user'
import { IUser } from 'src/controllers/user/interface'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const user = new User()

  try {
    const body = JSON.parse(event.body)

    const newUser: IUser = { userId: body.user_id, ...body }

    const data = await user.create(newUser)

    api.httpResponse(callback, 'success', undefined, data)
  } catch (err) {
    api.httpResponse(callback, 'fail', err)
  }
}
