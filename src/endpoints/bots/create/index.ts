import AWS from "aws-sdk";
import { CreateApiRequest } from "aws-sdk/clients/apigatewayv2";
import { CreateFunctionRequest } from "aws-sdk/clients/lambda";
import { PutObjectRequest } from "aws-sdk/clients/s3";
import JSZip from "jszip";
import { v4 as uuidv4 } from "uuid";

const ddb = new AWS.DynamoDB.DocumentClient();
const apigateway = new AWS.ApiGatewayV2();
const lambda = new AWS.Lambda();
const s3 = new AWS.S3();
const zip = new JSZip();

const BOTS_PERMISSION = process.env.BOTS_PERMISSION || "";
const BOTS_TABLE = process.env.BOTS_TABLE || "";
const BOTS_BUCKET = process.env.BOTS_BUCKET || "";
const BOT_PREFIX = process.env.BOT_PREFIX || "";
const SERVICE_PREFIX = process.env.SERVICE_PREFIX || "";

exports.handler = (event, context, callback) => {
  const input_data = JSON.parse(event.body);

  const { user_id } = input_data;

  const bot_id = uuidv4();

  const task_id = Date.now();

  const botConfig = {
    bot_id,
    user_id,
    name: "",
    active: false,
    tasks: [
      {
        id: task_id,
        type: "trigger",
      },
    ],
  };

  const bot_code = `
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: "us-east-1" });

const user_id = '${user_id}';
const bot_id = '${bot_id}';

module.exports.handler = async (event, context, callback) => {

    let task0_output_data;
    
    if (event.body)
        try {
            task0_output_data = JSON.parse(event.body);
        } catch (error) {
            task0_output_data = event.body;
        }
    
    await lambda.invoke({
        FunctionName: '${SERVICE_PREFIX}-sample-update',
        Payload: JSON.stringify({ user_id, bot_id, task_index: 0, status: 'success', output_data: task0_output_data })
    }).promise();

    callback(null, {
        statusCode: 200,
        headers: {
            'Content-type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            success: true
        })
    }); 
};
    `;

  zip.file("index.js", bot_code);
  zip
    .generateAsync({ type: "base64" })
    .then((archive) => {
      const buffer = Buffer.from(archive, "base64");
      
      const bucketParams:PutObjectRequest = {
        Bucket: BOTS_BUCKET,
        Key: `${bot_id}.zip`,
        Body: buffer,
      };

      s3.upload(bucketParams)
        .promise()
        .then(() => {
          const lambdaParams:CreateFunctionRequest = {
            FunctionName: `${BOT_PREFIX}-${bot_id}`,
            Handler: "index.handler",
            Runtime: "nodejs12.x",
            Role: BOTS_PERMISSION,
            Code: {
              S3Bucket: BOTS_BUCKET,
              S3Key: `${bot_id}.zip`,
            },
          };

          lambda
            .createFunction(lambdaParams)
            .promise()
            .then((lambda) => {
              const apiParams:CreateApiRequest = {
                Name: `${BOT_PREFIX}-${bot_id}`,
                ProtocolType: "HTTP",
                CredentialsArn: BOTS_PERMISSION,
                RouteKey: "ANY /bot",
                Target: lambda.FunctionArn,
                CorsConfiguration: {
                  AllowHeaders: ["*"],
                  AllowOrigins: ["*"],
                  AllowMethods: ["*"],
                },
              };

              apigateway
                .createApi(apiParams)
                .promise()
                .then((api) => {
                  const dbParams = {
                    TableName: BOTS_TABLE,
                    Item: {
                      ...botConfig,
                      api_id: api.ApiId,
                      trigger_url: `${api.ApiEndpoint}/bot`,
                    },
                  };

                  ddb
                    .put(dbParams)
                    .promise()
                    .then(() => {
                      callback(null, {
                        statusCode: 200,
                        headers: {
                          "Content-type": "application/json",
                          "Access-Control-Allow-Origin": "*",
                        },
                        body: JSON.stringify({
                          success: true,
                          message: "bot created successfully",
                          data: dbParams.Item,
                        }),
                      });
                    })
                    .catch(callback);
                })
                .catch(callback);
            })
            .catch(callback);
        })
        .catch(callback);
    })
    .catch(callback);
};
