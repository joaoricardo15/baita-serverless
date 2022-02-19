import { Api } from "src/utils/api";
import { Log } from "src/controllers/log";

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context);
  const log = new Log();

  try {
    const { bot_id } = event.pathParameters;

    const data = await log.getBotUsage(bot_id);

    api.httpResponse(callback, "success", undefined, data);
  } catch (err) {
    api.httpResponse(callback, "fail", err);
  }
};
