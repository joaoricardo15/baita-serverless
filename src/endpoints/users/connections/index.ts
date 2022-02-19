"use strict";

import { Api } from "src/utils/api";
import { Connection } from "src/controllers/connection";

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context);
  const connection = new Connection();

  try {
    const { user_id } = event.pathParameters;

    const data = await connection.getUserConnections(user_id);

    api.httpResponse(callback, "success", undefined, data);
  } catch (err) {
    api.httpResponse(callback, "fail", err);
  }
};
