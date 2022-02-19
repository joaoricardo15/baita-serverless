"use strict";

import { Api } from "src/utils/api";
import { Bot } from "src/controllers/bot";

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context);
  const bot = new Bot();

  try {
    const body = JSON.parse(event.body);

    const { user_id } = body;

    const data = await bot.createBot(user_id);

    api.httpResponse(callback, "success", undefined, data);
  } catch (err) {
    api.httpResponse(callback, "fail", err);
  }
};
