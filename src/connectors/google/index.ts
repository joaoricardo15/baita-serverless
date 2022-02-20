"use strict";

import { Api } from "src/utils/api";
import { Bot } from "src/controllers/bot";
import { Connection } from "src/controllers/connection";
import { Google } from "./google";

const google = new Google();

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context);
  const bot = new Bot();
  const connection = new Connection();

  try {
    const { code, state, error } = event.queryStringParameters;

    if (error) return api.httpConnectorResponse(callback, "fail");

    const { app_id, user_id, bot_id, task_index } =
      google.desconstructAuthState(state);

    const credentials = await google.getCredentials(code);

    const { access_token } = credentials
      
    const { connection_id, email } = await google.getConnectionInfo(access_token);

    const newConnection = {
      user_id,
      app_id,
      connection_id,
      credentials,
      name: email,
      email
    };

    await connection.createConnection(newConnection);

    await bot.addConnection(user_id, bot_id, connection_id, task_index);

    api.httpConnectorResponse(callback, "success");
  } catch (err) {
    api.httpConnectorResponse(callback, "fail");
  }
};
