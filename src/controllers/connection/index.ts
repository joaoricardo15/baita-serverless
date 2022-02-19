"use strict";

import AWS from "aws-sdk";

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || "";

export class Connection {
  async getUserConnections(user_id: string): Promise<any> {
    const ddb = new AWS.DynamoDB.DocumentClient();
    
    try {
      const result = await ddb
        .query({
          TableName: CONNECTIONS_TABLE,
          KeyConditionExpression: "#user = :user",
          ProjectionExpression: "#user,#app,#connection,#name,#email",
          ExpressionAttributeNames: {
            "#user": "user_id",
            "#app": "app_id",
            "#connection": "connection_id",
            "#name": "name",
            "#email": "email",
          },
          ExpressionAttributeValues: {
            ":user": user_id,
          },
        })
        .promise();

      return result.Items;
    } catch (err) {
      throw err.code;
    }
  }
}
