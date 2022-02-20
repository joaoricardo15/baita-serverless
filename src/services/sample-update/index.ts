"use strict";

import { Api } from "src/utils/api";
import { Bot } from "src/controllers/bot";

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context);
  const bot = new Bot();

  try {
    const { user_id, bot_id, task_index, status, input_data, output_data } =
      event;

    const sample = {
      status,
      input_data,
      output_data,
      timestamp: Date.now()
    };

    const data = await bot.addSampleResult(user_id, bot_id, task_index, sample)

    api.httpResponse(callback, 'success', undefined, data)
  } catch (err) {
    api.httpResponse(callback, 'fail', err)
  }
};
