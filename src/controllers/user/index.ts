"use strict";

import AWS from "aws-sdk";
import { IUser, validateUser } from "./interface";

const USERS_TABLE = process.env.USERS_TABLE || "";

export class User {
  async create(user: IUser) {
    const ddb = new AWS.DynamoDB.DocumentClient();
    
    validateUser(user);

    try {
      await ddb
        .put({
          TableName: USERS_TABLE,
          Item: user,
        })
        .promise();

      return user;
    } catch (err) {
      throw err.message;
    }
  }
}
