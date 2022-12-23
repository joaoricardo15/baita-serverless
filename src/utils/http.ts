'use strict'

export class Http {
  getOutputData(data: any, path: string) {
    if (!path) return data

    const paths = path.split('.')

    for (let i = 0; i < paths.length; i++) {
      const type = paths[i].split(':')[0]
      const value = paths[i].split(':')[1]
      data = data[type === 'number' ? parseInt(value) : value]
    }

    return data
  }

  getUrlFromParameters(baseUrl: string, config, inputData) {
    const { path, urlParams, queryParams, auth } = config

    let url = baseUrl

    url += path

    if (urlParams && urlParams.length) {
      url += '/'
      for (let i = 0; i < urlParams.length; i++) {
        const source =
          urlParams[i].value !== undefined
            ? urlParams[i].value
            : urlParams[i].config
            ? config[urlParams[i].config]
            : urlParams[i].serviceAuth
            ? auth[urlParams[i].serviceAuth]
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
            : queryParams[i].serviceAuth
            ? auth[queryParams[i].serviceAuth]
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

  getDataFromParameters(config, inputData) {
    const { auth, bodyParams } = config

    const data = {}
    if (bodyParams && bodyParams.length) {
      for (let i = 0; i < bodyParams.length; i++) {
        const source =
          bodyParams[i].value !== undefined
            ? bodyParams[i].value
            : bodyParams[i].config
            ? config[bodyParams[i].config]
            : bodyParams[i].serviceAuth
            ? auth[bodyParams[i].serviceAuth]
            : bodyParams[i].inputField
            ? inputData[bodyParams[i].inputField]
            : ''

        data[bodyParams[i].name] = source
      }
    }

    return data
  }
}
