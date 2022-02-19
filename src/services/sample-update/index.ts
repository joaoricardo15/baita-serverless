"use strict";

import AWS from "aws-sdk";
import { UpdateItemInput } from "aws-sdk/clients/dynamodb";

const ddb = new AWS.DynamoDB.DocumentClient();

const BOTS_TABLE = process.env.BOTS_TABLE || "";

exports.handler = (event, context, callback) => {
  const { user_id, bot_id, task_index, status, input_data, output_data } =
    event;

  const timestamp = Date.now();

  const sample = {
    status,
    input_data,
    output_data,
    timestamp,
  };

  let UpdateExpression: any,
    ExpressionAttributeNames: any,
    ExpressionAttributeValues: any;

  if (task_index == 0) {
    UpdateExpression = `set #tks[${task_index}].sample_result = :sample, #tg = list_append(if_not_exists(#tg, :empty_list), :sample_list)`;
    ExpressionAttributeNames = {
      "#tks": "tasks",
      "#tg": "trigger_samples",
    };
    ExpressionAttributeValues = {
      ":sample": sample,
      ":empty_list": [],
      ":sample_list": [sample],
    };
  } else {
    UpdateExpression = `set #tks[${task_index}].sample_result = :sample`;
    ExpressionAttributeNames = {
      "#tks": "tasks",
    };
    ExpressionAttributeValues = {
      ":sample": sample,
    };
  }

  const sampleParams: UpdateItemInput = {
    TableName: BOTS_TABLE,
    Key: {
      bot_id: bot_id,
      user_id: user_id,
    },
    ReturnValues: "ALL_NEW",
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  };

  ddb
    .update(sampleParams)
    .promise()
    .then((data) => {
      callback(null, {
        success: true,
        data: data.Attributes,
      });
    })
    .catch((error) => callback({ success: false, ...error }));
};
