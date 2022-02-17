import AWS from "aws-sdk";
import Axios from "axios";
import { URLSearchParams } from 'url';

const ddb = new AWS.DynamoDB.DocumentClient();

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || "";

exports.handler = (event, context, callback) => {
  let input;

  try {
    input = JSON.parse(event);
  } catch (error) {
    input = event;
  }

  const { connection, config, input_data, output_path } = input;

  const getParams = {
    TableName: CONNECTIONS_TABLE,
    Key: {
      user_id: connection.user_id,
      connection_id: connection.connection_id,
    },
  };

  ddb
    .get(getParams)
    .promise()
    .then((result:any) => {
      const credentials = result.Item.credentials;

      const oauth2_url = connection.app_config.auth_url;
      const oauth2_method = connection.app_config.auth_method;
      const oauth2_type = connection.app_config.auth_type;

      const oauth2_headers = connection.app_config.auth_headers;

      const oauth2_refresh_token =
        credentials.refresh_token || credentials.access_token;

      let oauth2_data:any;
      if (
        oauth2_headers["Content-type"] &&
        oauth2_headers["Content-type"] === "application/x-www-form-urlencoded"
      ) {
        const data = {
          grant_type: "refresh_token",
          refresh_token: oauth2_refresh_token,
        };

        if (oauth2_type === "body") {
          data["client_id"] =
            process.env[connection.app_config.auth_fields.username];
          data["client_secret"] =
            process.env[connection.app_config.auth_fields.password];
        }

        oauth2_data = new URLSearchParams(data);
      } else {
        oauth2_data = {
          grant_type: "refresh_token",
          refresh_token: oauth2_refresh_token,
        };

        if (oauth2_type === "body") {
          oauth2_data["client_id"] =
            process.env[connection.app_config.auth_fields.username];
          oauth2_data["client_secret"] =
            process.env[connection.app_config.auth_fields.password];
        }
      }

      let oauth2_auth;
      if (oauth2_type === "basic")
        oauth2_auth = {
          username: process.env[connection.app_config.auth_fields.username],
          password: process.env[connection.app_config.auth_fields.password],
        };

      Axios({
        url: oauth2_url,
        method: oauth2_method,
        auth: oauth2_auth,
        headers: oauth2_headers,
        data: oauth2_data,
      })
        .then((response:any) => {
          const access_token = response.data.access_token;

          const {
            path,
            method,
            headers,
            body_params,
            url_params,
            query_params,
          } = config;

          const request_method = method;

          const request_headers = {
            Authorization: `Bearer ${access_token}`,
            ...headers,
          };

          let { api_url: request_url } = connection.app_config;

          request_url += path;

          if (url_params && url_params.length) {
            request_url += "/";
            for (let i = 0; i < url_params.length; i++) {
              const source =
                url_params[i].value !== undefined
                  ? url_params[i].value
                  : url_params[i].service_config
                  ? config[url_params[i].service_config]
                  : url_params[i].input_field
                  ? input_data[url_params[i].input_field]
                  : "";

              const encoded_source = encodeURIComponent(source).replace(
                /[!'()*]/g,
                (c) => "%" + c.charCodeAt(0).toString(16)
              );

              request_url += `${encoded_source}/`;
            }
          }

          if (query_params && query_params.length) {
            request_url += "?";
            for (let i = 0; i < query_params.length; i++) {
              const source =
                query_params[i].value !== undefined
                  ? query_params[i].value
                  : query_params[i].service_config
                  ? config[query_params[i].service_config]
                  : query_params[i].input_field
                  ? input_data[query_params[i].input_field]
                  : "";

              const encoded_source = encodeURIComponent(source).replace(
                /[!'()*]/g,
                (c) => "%" + c.charCodeAt(0).toString(16)
              );

              request_url += `${query_params[i].var_name}=${encoded_source}&`;
            }
          }

          let request_data;
          if (body_params && body_params.length) {
            request_url += "/";

            for (let i = 0; i < body_params.length; i++) {
              const source =
                body_params[i].value !== undefined
                  ? body_params[i].value
                  : body_params[i].service_config
                  ? config[body_params[i].service_config]
                  : body_params[i].input_field
                  ? input_data[body_params[i].input_field]
                  : "";

              if (!request_data) request_data = {};

              request_data[body_params[i].var_name] = source;
            }
          }

          Axios({
            url: request_url,
            method: request_method,
            headers: request_headers,
            data: request_data,
          })
            .then((response:any) => {
              console.log(response);
              if (!response.data)
                return callback(null, {
                  success: true,
                  message:
                    response.message ||
                    response.errorMessage ||
                    "nothing for you this time : (",
                });
              else {
                let output_data = response.data;

                if (output_path) {
                  const paths = output_path.split(".");

                  for (let i = 0; i < paths.length; i++) {
                    const type = paths[i].split(":")[0];
                    const value = paths[i].split(":")[1];
                    output_data =
                      output_data[type === "number" ? parseInt(value) : value];
                  }
                }

                callback(null, {
                  success: true,
                  data: output_data,
                });
              }
            })
            .catch(() =>
              callback(null, {
                success: false,
                message: "nothing for you this time : (",
              })
            );
        })
        .catch(callback);
    })
    .catch(callback);
};
