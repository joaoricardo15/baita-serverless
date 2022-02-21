"use strict";

import AWS from "aws-sdk";
import { IConnection, validateConnection } from "./interface";

const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || "";

export class Connection {
  async getConnection(user_id: string, connection_id: string) {
    const ddb = new AWS.DynamoDB.DocumentClient();

    try {
      const result = await ddb
        .get({
          TableName: CONNECTIONS_TABLE,
          Key: {
            user_id: user_id,
            connection_id: connection_id,
          },
        })
        .promise()

      return result.Item as IConnection
    } catch (err) {
      throw err.message;
    }
  }
  
  async getUserConnections(user_id: string) {
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

      return result.Items as Array<IConnection>;
    } catch (err) {
      throw err.message;
    }
  }

  async createConnection(connection: IConnection) {
    const ddb = new AWS.DynamoDB.DocumentClient();

    validateConnection(connection)

    try {
       await ddb
        .put({
          TableName: CONNECTIONS_TABLE,
          Item: connection,
        })
        .promise();

      return connection;
    } catch (err) {
      throw err.message;
    }
  }
}
