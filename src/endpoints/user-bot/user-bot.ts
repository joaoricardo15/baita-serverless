import AWS from "aws-sdk";

const ddb = new AWS.DynamoDB.DocumentClient();

const BOTS_TABLE = process.env.BOTS_TABLE || "";

exports.handler = (event, context, callback) => {
  const { user_id, bot_id } = event.pathParameters;

  const getParams = {
    TableName: BOTS_TABLE,
    Key: {
      user_id: user_id,
      bot_id: bot_id,
    },
  };

  ddb
    .get(getParams)
    .promise()
    .then((get_result) => {
      callback(null, {
        statusCode: 200,
        headers: {
          "Content-type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: true,
          data: get_result.Item,
        }),
      });
    })
    .catch(callback);
};
