import AWS from "aws-sdk";

const ddb = new AWS.DynamoDB.DocumentClient();

const BOTS_TABLE = process.env.BOTS_TABLE || "";

exports.handler = (event, context, callback) => {
  let input_data;

  try {
    input_data = JSON.parse(event.body);
  } catch (error) {
    input_data = event.body;
  }

  const { user_id, bot_id, name, active, tasks } = input_data;

  const dbParams = {
    TableName: BOTS_TABLE,
    Key: {
      bot_id: bot_id,
      user_id: user_id,
    },
    UpdateExpression: "set #tk = :tk, #nm = :nm, #act = :act",
    ExpressionAttributeNames: {
      "#tk": "tasks",
      "#nm": "name",
      "#act": "active",
    },
    ExpressionAttributeValues: {
      ":tk": tasks,
      ":nm": name,
      ":act": active,
    },
    ReturnValues: "ALL_NEW",
  };

  ddb
    .update(dbParams)
    .promise()
    .then((data) => {
      callback(null, {
        statusCode: 200,
        headers: {
          "Content-type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: true,
          message: "bot updated successfully",
          data: data.Attributes,
        }),
      });
    })
    .catch(callback);
};
