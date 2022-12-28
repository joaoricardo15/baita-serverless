'use strict'

import { InputSource } from 'src/models/service'

export class Http {
  getDataFromPath(data: any, path: string) {
    if (!path) return data

    const paths = path.split('.')

    try {
      for (let i = 0; i < paths.length; i++) {
        const [type, value] = paths[i].split(':')
        data = data[type === 'number' ? parseInt(value) : value]
      }
      return data
    } catch (err) {
      return {}
    }
  }

  getUrlFromInputs(config, connection, inputData) {
    const { path, urlParams, queryParams, auth } = config

    let url = connection.config.apiUrl

    url += path

    if (urlParams) {
      url += '/'
      for (let i = 0; i < urlParams.length; i++) {
        const { source, fieldName, value } = urlParams[i]

        const fieldValue =
          source === InputSource.value
            ? value
            : source === InputSource.auth
            ? auth[fieldName]
            : source === InputSource.service
            ? config[fieldName]
            : source === InputSource.connection
            ? connection[fieldName]
            : source === InputSource.input
            ? inputData[fieldName]
            : ''

        const encodedSource = encodeURIComponent(fieldValue).replace(
          /[!'()*]/g,
          (c) => '%' + c.charCodeAt(0).toString(16)
        )

        url += `${encodedSource}/`
      }
    }

    if (queryParams) {
      url += '?'
      for (let i = 0; i < queryParams.length; i++) {
        const { paramName, source, fieldName, value } = queryParams[i]

        const fieldValue =
          source === InputSource.value
            ? value
            : source === InputSource.auth
            ? auth[fieldName]
            : source === InputSource.service
            ? config[fieldName]
            : source === InputSource.connection
            ? connection[fieldName]
            : source === InputSource.input
            ? inputData[fieldName]
            : ''

        const encodedSource = encodeURIComponent(fieldValue).replace(
          /[!'()*]/g,
          (c) => '%' + c.charCodeAt(0).toString(16)
        )

        url += `${paramName}=${encodedSource}&`
      }
    }

    return url
  }

  getDataFromInputs(config, connection, inputData) {
    const { auth, bodyParams } = config

    const data = {}
    if (bodyParams) {
      for (let i = 0; i < bodyParams.length; i++) {
        const { paramName, source, fieldName, value } = bodyParams[i]

        const fieldValue =
          source === InputSource.value
            ? value
            : source === InputSource.auth
            ? auth[fieldName]
            : source === InputSource.service
            ? config[fieldName]
            : source === InputSource.connection
            ? connection[fieldName]
            : source === InputSource.input
            ? inputData[fieldName]
            : ''

        data[paramName] = fieldValue
      }
    }

    return data
  }
}
