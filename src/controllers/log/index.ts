"use strict";

import AWS from "aws-sdk";
import { ILog } from "./interface";

const LOGS_TABLE = process.env.LOGS_TABLE || "";

export class Log {
  async getBotLogs(bot_id: string) {
    const ddb = new AWS.DynamoDB.DocumentClient();
    
    try {
      const result = await ddb
        .query({
          TableName: LOGS_TABLE,
          Limit: 20,
          KeyConditionExpression: "bot_id = :id",
          ExpressionAttributeValues: {
            ":id": bot_id,
          },
          ScanIndexForward: false,
        })
        .promise();

      return result.Items;
    } catch (err) {
      throw err.code;
    }
  }

  async getBotUsage(bot_id: string) {
    const ddb = new AWS.DynamoDB.DocumentClient();
    
    try {

      const usage = { total: 0 };

      const queryParams = {
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
      }

      const queryBotUsage = async (queryParams) => {

        const result = await ddb.query(queryParams).promise();

        if (result && result.Items) {

          result.Items.forEach((item) => {
            usage.total += item.usage;
          });
    
          if (typeof result.LastEvaluatedKey != "undefined") {
            queryParams.ExclusiveStartKey = result.LastEvaluatedKey;
            return await queryBotUsage(queryParams);
          } else {
            return usage
          }
        }
      }

      return queryBotUsage(queryParams)
    } catch (err) {
      throw err.code;
    }
  }

  async createLog(log: ILog) {
    const ddb = new AWS.DynamoDB.DocumentClient();

    try {
      await ddb
        .put({
          TableName: LOGS_TABLE,
          Item: log,
        })
        .promise()
    } catch (err) {
      throw err.code;
    }
  }
}
