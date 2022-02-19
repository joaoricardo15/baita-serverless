"use strict";

import AWS from "aws-sdk";
import { PutItemInput, UpdateItemInput } from "aws-sdk/clients/dynamodb";
import Axios from "axios";
import qs from "qs";

const ddb = new AWS.DynamoDB.DocumentClient();

const BOTS_TABLE = process.env.BOTS_TABLE || "";
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || "";
const SERVICE_PROD_URL = process.env.SERVICE_PROD_URL || "";
const GOOGLE_AUTH_URL = process.env.GOOGLE_AUTH_URL || "";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

exports.handler = (event, context, callback) => {
  const { code, state, error } = event.queryStringParameters;

  const callbackPayload = {
    statusCode: 200,
    headers: { "Content-type": "text/html" },
    body: "<script>window.close()</script>",
  };

  if (error) return callback(null, callbackPayload);

  const app_id = state.split(":")[0];
  const user_id = state.split(":")[1];
  const bot_id = state.split(":")[2];
  const task_index = state.split(":")[3];

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const data = qs.stringify({
    code: code,
    grant_type: "authorization_code",
    redirect_uri: `${SERVICE_PROD_URL}/connectors/google`,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    access_type: "offline",
  });

  Axios({
    method: "post",
    url: GOOGLE_AUTH_URL,
    headers,
    data,
  })
    .then((credentialsResult: any) => {
      if (credentialsResult.message || credentialsResult.errorMessage)
        return callback(null, callbackPayload);
      else if (credentialsResult.data) {
        const credentials = credentialsResult.data;

        Axios({
          method: "get",
          url: `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${credentials.access_token}`,
        })
          .then((userResult: any) => {
            if (userResult.message || userResult.errorMessage)
              callback(null, callbackPayload);
            else {
              const { id, email } = userResult.data;
              const connection_id = id;

              const putParams: PutItemInput = {
                TableName: CONNECTIONS_TABLE,
                Item: {
                  name: email,
                  email,
                  app_id,
                  user_id,
                  credentials,
                  connection_id,
                },
              };

              ddb
                .put(putParams)
                .promise()
                .then(() => {
                  const updateParams: UpdateItemInput = {
                    TableName: BOTS_TABLE,
                    Key: {
                      // bot_id: bot_id,  TODO error on deploy
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
                    .update(updateParams)
                    .promise()
                    .then(() => {
                      callback(null, callbackPayload);
                    })
                    .catch(callback);
                })
                .catch(callback);
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
