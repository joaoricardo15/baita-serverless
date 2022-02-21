"use strict";

import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { Code } from "../../utils/code";

const BOTS_TABLE = process.env.BOTS_TABLE || "";
const BOTS_BUCKET = process.env.BOTS_BUCKET || "";
const BOTS_PERMISSION = process.env.BOTS_PERMISSION || "";
const SERVICE_PREFIX = process.env.SERVICE_PREFIX || "";

export class Bot {
  async getBot(user_id: string, bot_id: string) {
    const ddb = new AWS.DynamoDB.DocumentClient();

    try {
      const result = await ddb
        .get({
          TableName: BOTS_TABLE,
          Key: {
            user_id: user_id,
            bot_id: bot_id,
          },
        })
        .promise();

      return result.Item;
    } catch (err) {
      throw err.message;
    }
  }

  async getBotsByUser(user_id: string) {
    const ddb = new AWS.DynamoDB.DocumentClient();

    try {
      const result = await ddb
        .query({
          TableName: BOTS_TABLE,
          KeyConditionExpression: "user_id = :id",
          ExpressionAttributeValues: {
            ":id": user_id,
          },
        })
        .promise();

      return result.Items;
    } catch (err) {
      throw err.message;
    }
  }

  async createBot(user_id: string) {
    const ddb = new AWS.DynamoDB.DocumentClient();
    const apigateway = new AWS.ApiGatewayV2();
    const lambda = new AWS.Lambda();
    const s3 = new AWS.S3();
    const code = new Code();

    try {
      const bot_id = uuidv4();

      const sampleCode = code.getSampleCode(user_id, bot_id);
      const codeFile = await code.getCodeFile(sampleCode);

      await s3
        .upload({
          Bucket: BOTS_BUCKET,
          Key: `${bot_id}.zip`,
          Body: codeFile,
        })
        .promise();

      const lambdaResult = await lambda
        .createFunction({
          FunctionName: `${SERVICE_PREFIX}-${bot_id}`,
          Handler: "index.handler",
          Runtime: "nodejs12.x",
          Role: BOTS_PERMISSION,
          Code: {
            S3Bucket: BOTS_BUCKET,
            S3Key: `${bot_id}.zip`,
          },
        })
        .promise();

      const botUrl = "/bot";

      const apiResult = await apigateway
        .createApi({
          Name: `${SERVICE_PREFIX}-${bot_id}`,
          ProtocolType: "HTTP",
          CredentialsArn: BOTS_PERMISSION,
          RouteKey: `ANY ${botUrl}`,
          Target: lambdaResult.FunctionArn,
          CorsConfiguration: {
            AllowHeaders: ["*"],
            AllowOrigins: ["*"],
            AllowMethods: ["*"],
          },
        })
        .promise();

      const bot = {
        bot_id,
        user_id,
        api_id: apiResult.ApiId,
        trigger_url: `${apiResult.ApiEndpoint}${botUrl}`,
        name: "",
        active: false,
        tasks: [
          {
            id: Date.now(),
            type: "trigger",
          },
        ],
      };

      await ddb
        .put({
          TableName: BOTS_TABLE,
          Item: bot,
        })
        .promise();

      return bot;
    } catch (err) {
      throw err.message;
    }
  }

  async deleteBot(
    user_id: string,
    bot_id: string,
    api_id: string
  ) {
    const ddb = new AWS.DynamoDB.DocumentClient();
    const apigateway = new AWS.ApiGatewayV2();
    const lambda = new AWS.Lambda();
    const s3 = new AWS.S3();

    try {
      await ddb
        .delete({
          TableName: BOTS_TABLE,
          Key: {
            user_id,
            bot_id,
          },
        })
        .promise();

      await apigateway
        .deleteApi({
          ApiId: api_id,
        })
        .promise();

      await lambda
        .deleteFunction({
          FunctionName: `${SERVICE_PREFIX}-${bot_id}`,
        })
        .promise();

      await s3
        .deleteObject({
          Bucket: BOTS_BUCKET,
          Key: `${bot_id}.zip`,
        })
        .promise();
    } catch (err) {
      throw err.message;
    }
  }

  async updateBot(
    user_id: string,
    bot_id: string,
    name: string,
    active: boolean,
    tasks: object
  ) {
    const ddb = new AWS.DynamoDB.DocumentClient();

    try {
      const result = await ddb
        .update({
          TableName: BOTS_TABLE,
          Key: {
            bot_id,
            user_id,
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
        })
        .promise();

      return result.Attributes;
    } catch (err) {
      throw err.message;
    }
  }

  async deployBot(
    user_id: string,
    bot_id: string,
    name: string,
    active: boolean,
    tasks: object
  ) {
    const ddb = new AWS.DynamoDB.DocumentClient();
    const lambda = new AWS.Lambda();
    const s3 = new AWS.S3();
    const code = new Code();

    try {
      const botCode = code.getBotCode(user_id, bot_id, active, tasks);
      const codeFile = await code.getCodeFile(botCode);

      await s3
        .upload({
          Bucket: BOTS_BUCKET,
          Key: `${bot_id}.zip`,
          Body: codeFile,
        })
        .promise();

      await lambda
        .updateFunctionCode({
          FunctionName: `${SERVICE_PREFIX}-${bot_id}`,
          S3Bucket: BOTS_BUCKET,
          S3Key: `${bot_id}.zip`,
        })
        .promise();

      const dbResult = await ddb
        .update({
          TableName: BOTS_TABLE,
          Key: {
            bot_id: bot_id,
            user_id: user_id,
          },
          UpdateExpression: "set #tk = :tk, #act = :act, #nm = :nm",
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
        })
        .promise();

      return dbResult.Attributes;
    } catch (err) {
      throw err.message;
    }
  }

  async testBot(user_id: string, bot_id: string, task_index: number) {
    const lambda = new AWS.Lambda();

    try {
      const testLambdaResult = await lambda
        .invoke({
          FunctionName: `${SERVICE_PREFIX}-${bot_id}`,
          Payload: JSON.stringify({ test_task_index: task_index }),
        })
        .promise();

      const testLambdaParsedPayload = JSON.parse(
        testLambdaResult.Payload as string
      );

      const testLambdaParsedResult = JSON.parse(testLambdaParsedPayload.body);

      const executionSuccess = testLambdaParsedResult.success;

      const task_output_data =
        executionSuccess && testLambdaParsedResult.data
          ? testLambdaParsedResult.data
          : {
              message:
                testLambdaParsedResult.message ||
                testLambdaParsedResult.errorMessage ||
                "nothing for you this time : (",
            };

      const updateLambdaResult = await lambda
        .invoke({
          FunctionName: `${SERVICE_PREFIX}-sample-update`,
          Payload: JSON.stringify({
            user_id,
            bot_id,
            task_index,
            status: task_output_data.status,
            input_data: task_output_data.input_data,
            output_data: task_output_data.output_data,
          }),
        })
        .promise();

      const updateLambdaParsedPayload = JSON.parse(
        updateLambdaResult.Payload as string
      );

      const updateLambdaParsedResult = JSON.parse(updateLambdaParsedPayload.body);

      return updateLambdaParsedResult.data;
    } catch (err) {
      throw err.message;
    }
  }

  async addConnection(
    user_id: string,
    bot_id: string,
    connection_id: string,
    task_index: number
  ) {
    const ddb = new AWS.DynamoDB.DocumentClient();

    try {
      await ddb
        .update({
          TableName: BOTS_TABLE,
          Key: {
            bot_id: bot_id,
            user_id: user_id,
          },
          UpdateExpression: `set #tks[${task_index}].connection_id = :id`,
          ExpressionAttributeNames: {
            "#tks": "tasks",
          },
          ExpressionAttributeValues: {
            ":id": connection_id,
          },
          ReturnValues: "ALL_NEW",
        })
        .promise();
    } catch (err) {
      throw err.message;
    }
  }

  async addSampleResult(user_id:string, bot_id:string, task_index: number, sample: object) {
    const ddb = new AWS.DynamoDB.DocumentClient();

    try {

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

      const result = await ddb
        .update({
          TableName: BOTS_TABLE,
          Key: {
            bot_id: bot_id,
            user_id: user_id,
          },
          ReturnValues: "ALL_NEW",
          UpdateExpression,
          ExpressionAttributeNames,
          ExpressionAttributeValues,
        })
        .promise()

      return result.Attributes;
    } catch (err) {
      throw err.message;
    }
  }
}
