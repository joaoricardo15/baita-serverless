import AWS from "aws-sdk";
import { QueryInput } from "aws-sdk/clients/dynamodb";
const ddb = new AWS.DynamoDB.DocumentClient();

const LOGS_TABLE = process.env.LOGS_TABLE || "";

exports.handler = (event, context, callback) => {
  const { bot_id } = event.pathParameters;

  const queryParams:QueryInput = {
    TableName: LOGS_TABLE,
    Limit: 20,
    KeyConditionExpression: "bot_id = :id",
    ExpressionAttributeValues: {
      ":id": bot_id,
    },
    ScanIndexForward: false,
  };

  ddb
    .query(queryParams)
    .promise()
    .then((log) => {
      callback(null, {
        statusCode: 200,
        headers: {
          "Content-type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: true,
          data: log.Items,
        }),
      });
    })
    .catch(callback);
};
