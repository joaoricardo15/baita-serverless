import AWS from "aws-sdk";
import Axios from "axios";
import { URLSearchParams } from "url";

const ddb = new AWS.DynamoDB.DocumentClient();

const BOTS_TABLE = process.env.BOTS_TABLE || "";
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || "";
const SERVICE_PROD_URL = process.env.SERVICE_PROD_URL || "";
const PIPEDRIVE_AUTH_URL = process.env.PIPEDRIVE_AUTH_URL || "";
const PIPEDRIVE_CLIENT_ID = process.env.PIPEDRIVE_CLIENT_ID || "";
const PIPEDRIVE_CLIENT_SECRET = process.env.PIPEDRIVE_CLIENT_SECRET || "";

exports.handler = (event, context, callback) => {
  const { code, state, error } = event.queryStringParameters;

  const callback_payload = {
    statusCode: 200,
    headers: { "Content-type": "text/html" },
    body: "<script>window.close()</script>",
  };

  const callback_marketplace_payload = {
    statusCode: 200,
    headers: { "Content-type": "text/html" },
    body: '<script>window.location.href = "http://baita.help/successAppInstall"</script>',
  };

  if (error) return callback(null, callback_payload);

  let app_id, user_id, bot_id, task_index;

  if (state) {
    app_id = state.split(":")[0];
    user_id = state.split(":")[1];
    bot_id = state.split(":")[2];
    task_index = state.split(":")[3];
  }

  const auth = {
    username: PIPEDRIVE_CLIENT_ID,
    password: PIPEDRIVE_CLIENT_SECRET,
  };

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const data = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    redirect_uri: `${SERVICE_PROD_URL}/connectors/pipedrive`,
  });

  Axios({
    auth,
    method: "post",
    url: PIPEDRIVE_AUTH_URL,
    headers,
    data,
  })
    .then((credentialsResult:any) => {
      if (credentialsResult.message || credentialsResult.errorMessage)
        return callback(null, callback_payload);
      else if (credentialsResult.data) {
        const credentials = credentialsResult.data;

        Axios({
          method: "get",
          url: `${credentials.api_domain}/users/me`,
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
          },
        })
          .then((userResult:any) => {
            if (userResult.message || userResult.errorMessage)
              callback(null, callback_payload);
            else {
              const { id, name, email } = userResult.data.data;
              const connection_id = id.toString();

              const params = {
                TableName: CONNECTIONS_TABLE,
                Item: {
                  name: email,
                  user_name: name,
                  email,
                  app_id,
                  user_id,
                  credentials,
                  connection_id,
                },
              };

              if (state) {
                ddb
                  .put(params)
                  .promise()
                  .then(() => {
                    const sample_params = {
                      TableName: BOTS_TABLE,
                      Key: {
                        bot_id: bot_id,
                        user_id: user_id,
                      },
                      UpdateExpression: `set #tks[${task_index}].connection_id = :id`,
                      ExpressionAttributeNames: {
                        "#tks": "tasks",
                      },
                      ExpressionAttributeValues: {
                        ":id": connection_id,
                      },
                      ReturnValues: "ALL_NEW",
                    };

                    ddb
                      .update(sample_params)
                      .promise()
                      .then(() => {
                        callback(null, callback_payload);
                      })
                      .catch(callback);
                  })
                  .catch(callback);
              } else {
                callback(null, callback_marketplace_payload);
              }
            }
          })
          .catch((error) =>
            callback(null, {
              statusCode: 200,
              headers: { "Content-type": "text/html" },
              body: JSON.stringify(
                !error || !error.response ? error : error.response.data
              ),
            })
          );
      }
    })
    .catch((error) =>
      callback(null, {
        statusCode: 200,
        headers: { "Content-type": "text/html" },
        body: JSON.stringify(
          !error || !error.response ? error : error.response.data
        ),
      })
    );
};
