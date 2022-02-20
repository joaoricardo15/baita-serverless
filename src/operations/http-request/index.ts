"use strict";

import Axios from "axios";
import { Api } from "src/utils/api";
import { Http } from "src/utils/http";

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context);
  const http = new Http();

  try {
    const {
      config,
      input_data,
      output_path,
      connection: {
        app_config: { api_url },
      },
    } = event;

    const response = await Axios({
      method: config.method,
      headers: config.headers,
      url: http.getUrlFromParameters(api_url, config, input_data),
      data: http.getDataFromParameters(config, input_data),
    });

    const data = http.getOutputData(response.data, output_path);

    api.httpOperationResponse(callback, "success", data);
  } catch (err) {
    api.httpOperationResponse(callback, "fail", err);
  }
};
