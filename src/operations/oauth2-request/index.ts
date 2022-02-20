"use strict";

import Axios from "axios";
import { Api } from "src/utils/api";
import { Http } from "src/utils/http";
import { Oauth2 } from "src/utils/oauth2";
import { Connection } from "src/controllers/connection";

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context);
  const http = new Http();
  const oauth2 = new Oauth2();
  const connectionClient = new Connection();

  try {
    const {
      config,
      input_data,
      output_path,
      connection: {
        user_id,
        connection_id,
        app_config: {
          api_url,
          auth_url,
          auth_method,
          auth_type,
          auth_headers,
          auth_fields,
        },
      },
    } = event;

    // Get credentials from connection database
    const {
      credentials: { refresh_token },
    } = await connectionClient.getConnection(user_id, connection_id);

    // Get token from app's oauth2 authenticator server
    const {
      data: { access_token },
    } = await Axios({
      url: auth_url,
      method: auth_method,
      headers: auth_headers,
      auth: oauth2.getAuthFromParameters(auth_type, auth_fields),
      data: oauth2.getDataFromParameters(
        auth_type,
        auth_headers,
        auth_fields,
        refresh_token
      ),
    });

    // Http request
    const response = await Axios({
      method: config.method,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${access_token}`,
      },
      url: http.getUrlFromParameters(api_url, config, input_data),
      data: http.getDataFromParameters(config, input_data),
    });

    const data = http.getOutputData(response.data, output_path);

    api.httpOperationResponse(callback, "success", data);
  } catch (err) {
    api.httpOperationResponse(callback, "fail", err);
  }
};
