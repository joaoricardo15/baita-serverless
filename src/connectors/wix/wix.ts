import AWS from "aws-sdk";
import Axios from "axios";

const ddb = new AWS.DynamoDB.DocumentClient();

const BOTS_TABLE = process.env.BOTS_TABLE || "";
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || "";
const WIX_AUTH_URL = process.env.WIX_AUTH_URL;
const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID;
const WIX_CLIENT_SECRET = process.env.WIX_CLIENT_SECRET;

exports.handler = (event, context, callback) => {
  const { code, state, instanceId } = event.queryStringParameters;

  const callback_payload = {
    statusCode: 200,
    headers: {
      "Content-type": "text/html",
    },
    body: "<script>window.close()</script>",
  };

  const app_id = state.split(":")[0];
  const user_id = state.split(":")[1];
  const bot_id = state.split(":")[2];
  const task_index = state.split(":")[3];

  const data = {
    code,
    grant_type: "authorization_code",
    client_id: WIX_CLIENT_ID,
    client_secret: WIX_CLIENT_SECRET,
  };

  const headers = {
    "Content-Type": "application/json",
  };

  Axios({
    method: "post",
    url: WIX_AUTH_URL,
    headers,
    data,
  })
    .then((credentialsResult:any) => {
      if (credentialsResult.message || credentialsResult.errorMessage)
        return callback(null, callback_payload);
      else if (credentialsResult.data) {
        const credentials = credentialsResult.data;

        Axios({
          method: "post",
          url: "https://www.wix.com/_api/site-apps/v1/site-apps/token-received",
          headers: {
            Authorization: `Bearer ${credentials.access_token}`,
          },
        })
          .then((instalationFinishStepResult:any) => {
            if (
              instalationFinishStepResult.message ||
              instalationFinishStepResult.errorMessage
            )
              return callback(null, callback_payload);
            else {
              Axios({
                method: "get",
                url: "https://www.wixapis.com/apps/v1/instance",
                headers: {
                  Authorization: `Bearer ${credentials.access_token}`,
                },
              })
                .then((userResult:any) => {
                  if (userResult.message || userResult.errorMessage)
                    return callback(null, callback_payload);
                  else if (userResult.data) {
                    const connection_id = instanceId.toString();

                    const bot_params = {
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
                      .update(bot_params)
                      .promise()
                      .then(() => {
                        const { appName: name } = userResult.data.instance;

                        const connection_params = {
                          TableName: CONNECTIONS_TABLE,
                          Item: {
                            name,
                            app_name: name,
                            app_id,
                            user_id,
                            credentials,
                            connection_id,
                          },
                        };

                        ddb
                          .put(connection_params)
                          .promise()
                          .then(() => {
                            callback(null, callback_payload);
                          })
                          .catch(() => callback(null, callback_payload));
                      })
                      .catch(() => callback(null, callback_payload));
                  }
                })
                .catch((error) =>
                  callback(null, {
                    statusCode: 200,
                    headers: { "Content-type": "text/html" },
                    body: JSON.stringify(error.response.data),
                  })
                );
            }
          })
          .catch((error) =>
            callback(null, {
              statusCode: 200,
              headers: { "Content-type": "text/html" },
              body: JSON.stringify(error.response.data),
            })
          );
      }
    })
    .catch((error) =>
      callback(null, {
        statusCode: 200,
        headers: { "Content-type": "text/html" },
        body: JSON.stringify(error.response.data),
      })
    );
};
