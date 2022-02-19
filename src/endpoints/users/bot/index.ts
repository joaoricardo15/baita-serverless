"use strict";

import { Api } from "src/utils/api";
import { Bot } from "src/controllers/bot";

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context);
  const bot = new Bot();

  try {
    const { user_id, bot_id } = event.pathParameters;

    const data = await bot.getBot(user_id, bot_id);

    api.httpResponse(callback, "success", undefined, data);
  } catch (err) {
    api.httpResponse(callback, "fail", err);
  }
};
