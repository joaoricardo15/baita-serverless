'use strict'

import { URLSearchParams } from 'url'

export class Oauth2 {
  getDataFromParameters(type: string, headers, authFields, refreshToken) {
    let data
    if (
      headers &&
      headers['Content-type'] &&
      headers['Content-type'] === 'application/x-www-form-urlencoded'
    ) {
      const rawData = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }

      if (type === 'body') {
        rawData['client_id'] = process.env[authFields.username]
        rawData['client_secret'] = process.env[authFields.password]
      }

      data = new URLSearchParams(rawData)
    } else {
      data = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }

      if (type === 'body') {
        data['client_id'] = process.env[authFields.username]
        data['client_secret'] = process.env[authFields.password]
      }
    }

    return data
  }

  getAuthFromParameters(type: string, authFields) {
    let auth
    if (type === 'basic')
      auth = {
        username: process.env[authFields.username],
        password: process.env[authFields.password],
      }

    return auth
  }
}
