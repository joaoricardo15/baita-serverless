"use strict";

import { Api } from "src/utils/api";
import { Log } from "src/controllers/log";

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context);
  const log = new Log();

  try {
    const { user_id, bot_id, usage, logs, error } = event;

    const logSet = {
      bot_id,
      user_id,
      error,
      timestamp: Date.now(),
      usage,
      logs,
    };

    await log.createLog(logSet);

    api.httpResponse(callback, 'success')
  } catch (err) {
    api.httpResponse(callback, 'fail', err)
  }
};
