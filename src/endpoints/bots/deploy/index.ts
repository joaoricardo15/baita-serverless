"use strict";

import { Api } from "src/utils/api";
import { Bot } from "src/controllers/bot";

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context);
  const bot = new Bot();

  try {
    const body = JSON.parse(event.body);

    const { user_id, bot_id, name, active, tasks } = body;

    const data = await bot.deployBot(user_id, bot_id, name, active, tasks);

    api.httpResponse(callback, "success", undefined, data);
  } catch (err) {
    api.httpResponse(callback, "fail", err);
  }
};
