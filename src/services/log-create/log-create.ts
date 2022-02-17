import AWS from "aws-sdk";

const ddb = new AWS.DynamoDB.DocumentClient();

const LOGS_TABLE = process.env.LOGS_TABLE || "";

exports.handler = (event, context, callback) => {
  const { user_id, bot_id, usage, logs, error } = event;

  const timestamp = Date.now();

  const log_set = {
    bot_id,
    user_id,
    error,
    timestamp,
    usage,
    logs,
  };

  const logParams = {
    TableName: LOGS_TABLE,
    Item: log_set,
  };

  ddb
    .put(logParams)
    .promise()
    .then(() => callback(null, { success: true }))
    .catch((error) => callback({ success: false, ...error }));
};
