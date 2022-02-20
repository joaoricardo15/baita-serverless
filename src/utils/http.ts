"use strict";

export class Http {
  getOutputData(data: any, path: string) {
    if (!path) return data;

    const paths = path.split(".");

    for (let i = 0; i < paths.length; i++) {
      const type = paths[i].split(":")[0];
      const value = paths[i].split(":")[1];
      data = data[type === "number" ? parseInt(value) : value];
    }

    return data;
  }

  getUrlFromParameters(baseUrl: string, config, input_data) {
    
    const { path, url_params, query_params, auth } = config
    
    let url = baseUrl;

    url += path;

    if (url_params && url_params.length) {
      url += "/";
      for (let i = 0; i < url_params.length; i++) {
        const source =
          url_params[i].value !== undefined
            ? url_params[i].value
            : url_params[i].service_config
            ? config[url_params[i].service_config]
            : url_params[i].service_auth
            ? auth[url_params[i].service_auth]
            : url_params[i].input_field
            ? input_data[url_params[i].input_field]
            : "";

        const encoded_source = encodeURIComponent(source).replace(
          /[!'()*]/g,
          (c) => "%" + c.charCodeAt(0).toString(16)
        );

        url += `${encoded_source}/`;
      }
    }

    if (query_params && query_params.length) {
      url += "?";
      for (let i = 0; i < query_params.length; i++) {
        const source =
          query_params[i].value !== undefined
            ? query_params[i].value
            : query_params[i].service_config
            ? config[query_params[i].service_config]
            : query_params[i].service_auth
            ? auth[query_params[i].service_auth]
            : query_params[i].input_field
            ? input_data[query_params[i].input_field]
            : "";

        const encoded_source = encodeURIComponent(source).replace(
          /[!'()*]/g,
          (c) => "%" + c.charCodeAt(0).toString(16)
        );

        url += `${query_params[i].var_name}=${encoded_source}&`;
      }
    }

    return url
  }

  getDataFromParameters(config, input_data) {

    const { auth, body_params } = config

    const data = {};
    if (body_params && body_params.length) {
      for (let i = 0; i < body_params.length; i++) {
        const source =
          body_params[i].value !== undefined
            ? body_params[i].value
            : body_params[i].service_config
            ? config[body_params[i].service_config]
            : body_params[i].service_auth
            ? auth[body_params[i].service_auth]
            : body_params[i].input_field
            ? input_data[body_params[i].input_field]
            : "";

        data[body_params[i].var_name] = source;
      }
    }

    return data
  }
}
