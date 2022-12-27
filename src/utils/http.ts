'use strict'

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

    if (urlParams && urlParams.length) {
      url += '/'
      for (let i = 0; i < urlParams.length; i++) {
        const source =
          urlParams[i].value !== undefined
            ? urlParams[i].value
            : urlParams[i].config
            ? config[urlParams[i].config]
            : urlParams[i].connection
            ? connection[urlParams[i].connection]
            : urlParams[i].auth
            ? auth[urlParams[i].auth]
            : urlParams[i].inputField
            ? inputData[urlParams[i].inputField]
            : ''

        const encodedSource = encodeURIComponent(source).replace(
          /[!'()*]/g,
          (c) => '%' + c.charCodeAt(0).toString(16)
        )

        url += `${encodedSource}/`
      }
    }

    if (queryParams && queryParams.length) {
      url += '?'
      for (let i = 0; i < queryParams.length; i++) {
        const source =
          queryParams[i].value !== undefined
            ? queryParams[i].value
            : queryParams[i].config
            ? config[queryParams[i].config]
            : queryParams[i].connection
            ? connection[queryParams[i].connection]
            : queryParams[i].auth
            ? auth[queryParams[i].auth]
            : queryParams[i].inputField
            ? inputData[queryParams[i].inputField]
            : ''

        const encodedSource = encodeURIComponent(source).replace(
          /[!'()*]/g,
          (c) => '%' + c.charCodeAt(0).toString(16)
        )

        url += `${queryParams[i].name}=${encodedSource}&`
      }
    }

    return url
  }

  getDataFromInputs(config, connection, inputData) {
    const { auth, bodyParams } = config

    const data = {}
    if (bodyParams && bodyParams.length) {
      for (let i = 0; i < bodyParams.length; i++) {
        const source =
          bodyParams[i].value !== undefined
            ? bodyParams[i].value
            : bodyParams[i].config
            ? config[bodyParams[i].config]
            : bodyParams[i].connection
            ? connection[bodyParams[i].connection]
            : bodyParams[i].auth
            ? auth[bodyParams[i].auth]
            : bodyParams[i].inputField
            ? inputData[bodyParams[i].inputField]
            : ''

        data[bodyParams[i].name] = source
      }
    }

    return data
  }
}
