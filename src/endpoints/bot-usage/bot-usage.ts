import AWS from "aws-sdk";
import { QueryInput } from "aws-sdk/clients/dynamodb";

const ddb = new AWS.DynamoDB.DocumentClient();

const LOGS_TABLE = process.env.LOGS_TABLE || "";

exports.handler = (event, context, callback) => {
  const { bot_id } = event.pathParameters;

  const scanParams:QueryInput = {
    TableName: LOGS_TABLE,
    ProjectionExpression: "#usg",
    KeyConditionExpression: "#id = :id",
    ExpressionAttributeNames: {
      "#id": "bot_id",
      "#usg": "usage",
    },
    ExpressionAttributeValues: {
      ":id": bot_id,
    },
  };

  const scanResult = { total: 0 };

  ddb.query(scanParams, onQuery);

  function onQuery(err, query) {
    if (err) callback(err);
    else {
      query.Items.forEach((item) => {
        scanResult.total += item.usage;
      });

      if (typeof query.LastEvaluatedKey != "undefined") {
        scanParams.ExclusiveStartKey = query.LastEvaluatedKey;
        ddb.query(scanParams, onQuery);
      } else {
        callback(null, {
          statusCode: 200,
          headers: {
            "Content-type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            success: true,
            data: scanResult,
          }),
        });
      }
    }
  }
};
