import AWS from "aws-sdk";
import { DeleteApiRequest } from "aws-sdk/clients/apigatewayv2";
import { DeleteFunctionRequest } from "aws-sdk/clients/lambda";
import { DeleteObjectRequest } from "aws-sdk/clients/s3";

const ddb = new AWS.DynamoDB.DocumentClient();
const apigateway = new AWS.ApiGatewayV2();
const lambda = new AWS.Lambda();
const s3 = new AWS.S3();

const BOTS_TABLE = process.env.BOTS_TABLE || "";
const BOTS_BUCKET = process.env.BOTS_BUCKET || "";
const SERVICE_PREFIX = process.env.SERVICE_PREFIX || "";

exports.handler = (event, context, callback) => {
  let input_data;

  if (event.body)
    try {
      input_data = JSON.parse(event.body);
    } catch (error) {
      input_data = event.body;
    }

  const { user_id, bot_id, api_id } = input_data;

  const dbParams = {
    TableName: BOTS_TABLE,
    Key: {
      user_id: user_id,
      bot_id: bot_id,
    },
  };

  ddb
    .delete(dbParams)
    .promise()
    .then(() => {
      const apiParams:DeleteApiRequest = {
        ApiId: api_id,
      };

      apigateway
        .deleteApi(apiParams)
        .promise()
        .then(() => {
          const lambdaParams:DeleteFunctionRequest = {
            FunctionName: `${SERVICE_PREFIX}-${bot_id}`,
          };

          lambda
            .deleteFunction(lambdaParams)
            .promise()
            .then(() => {
              const bucketParams:DeleteObjectRequest = {
                Bucket: BOTS_BUCKET,
                Key: `${bot_id}.zip`,
              };

              s3.deleteObject(bucketParams)
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
                      message: "bot deleted successfully",
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
};
