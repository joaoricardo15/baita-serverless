const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const apigateway = new AWS.ApiGatewayV2();
const lambda = new AWS.Lambda();
const s3 = new AWS.S3();

const BOTS_TABLE = process.env.BOTS_TABLE;
const BOTS_BUCKET = process.env.BOTS_BUCKET;
const SERVICE_PREFIX = process.env.SERVICE_PREFIX;

module.exports.handler = (event, context, callback) => {

    let input_data;
    
    if (event.body)
        try {
            input_data = JSON.parse(event.body);
        } catch (error) {
            input_data = event.body;
        }

    const { user_id, bot_id, api_id } = input_data;

    var dbParams = {
        TableName: BOTS_TABLE,
        Key: {
            "user_id": user_id,
            "bot_id": bot_id
        }
    };

    ddb.delete(dbParams).promise()
        .then(() => {
  
            const apiParams = {
                ApiId: api_id
            };

            apigateway.deleteApi(apiParams).promise()
                .then(api => {

                    const lambdaParams = {
                        FunctionName: `${SERVICE_PREFIX}-bot-${bot_id}`,
                    };

                    lambda.deleteFunction(lambdaParams).promise()
                        .then(lambda => {
                            
                            var bucketParams = {
                                Bucket: BOTS_BUCKET,
                                Key: `${bot_id}.zip`
                            };
                
                            s3.deleteObject(bucketParams).promise()
                                .then(bucket => {
                                    callback(null, {
                                        statusCode: 200,
                                        headers: {
                                            'Content-type': 'application/json',
                                            'Access-Control-Allow-Origin': '*'
                                        },
                                        body: JSON.stringify({
                                            success: true,
                                            message: 'bot deleted successfully',
                                        })
                                    }); 
                                }).catch(error => callback(error));
                        }).catch(error => callback(error));
                }).catch(error => callback(error));
        }).catch(error => callback(error));
};