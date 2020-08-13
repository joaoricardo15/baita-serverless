const AWS = require('aws-sdk');
var JSZip = require("jszip");
const { v4: uuidv4 } = require('uuid');
const ddb = new AWS.DynamoDB.DocumentClient();
const apigateway = new AWS.ApiGatewayV2();
const lambda = new AWS.Lambda();
const s3 = new AWS.S3();
var zip = new JSZip();

const BOTS_ROLE = process.env.BOTS_ROLE;
const BOTS_BUCKET = process.env.BOTS_BUCKET;
const FUNCTIONS_PREFIX = process.env.FUNCTIONS_PREFIX;

module.exports.handler = (event, context, callback) => {

    const input_data = JSON.parse(event.body);

    const { user_id } =  input_data;

    const bot_id = uuidv4();

    const task_id = Date.now();

    const botConfig = {
        bot_id,
        user_id,
        name: '',
        tasks: [
            {
                id: task_id,
                type: 'trigger',
            }
        ],
        samples: [
            {
                id: task_id
            }
        ]
    };

    const bot_code = `
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: "us-east-1" });

const user_id = '${user_id}';
const bot_id = '${bot_id}';

module.exports.handler = async (event, context, callback) => {

    let trigger_data;
    
    if (event.body)
        try {
            trigger_data = JSON.parse(event.body);
        } catch (error) {
            trigger_data = event.body;
        }
    
    await lambda.invoke({
        FunctionName: '${FUNCTIONS_PREFIX}-sample-update',
        Payload: JSON.stringify({ user_id, bot_id, task_index: 0, output_data: trigger_data })
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
    `

    zip.file("index.js", bot_code);
    zip.generateAsync({ type: "base64" })
        .then(package => {
        
            const buffer = new Buffer.from(package, 'base64');
            const bucketParams = {
                Bucket: BOTS_BUCKET,
                Key: `${bot_id}.zip`,
                Body: buffer
            };

            s3.upload(bucketParams).promise()
                .then(bucket => {
                    
                    const lambdaParams = {
                        FunctionName: bot_id,
                        Handler: 'index.handler',
                        Runtime: 'nodejs12.x',
                        Role: BOTS_ROLE,
                        Code: {
                            S3Bucket: BOTS_BUCKET,
                            S3Key: `${bot_id}.zip`
                        }
                    };

                    lambda.createFunction(lambdaParams).promise()
                        .then(lambda => {
    
                            const apiParams = {
                                Name: bot_id,
                                ProtocolType: 'HTTP',
                                CredentialsArn: BOTS_ROLE,
                                RouteKey: 'ANY /bot',
                                Target: lambda.FunctionArn,
                                CorsConfiguration: {
                                    AllowHeaders: ['*'],
                                    AllowOrigins: ['*'],
                                    AllowMethods: ['*']
                                }
                            }

                            apigateway.createApi(apiParams).promise()
                                .then(api => {

                                    const dbParams = {
                                        TableName:'bots',
                                        Item: { 
                                            ...botConfig, 
                                            api_id: api.ApiId,
                                            trigger_url: `${api.ApiEndpoint}/bot`
                                        }
                                    };

                                    ddb.put(dbParams).promise()
                                        .then(() => {
                                            callback(null, {
                                                statusCode: 200,
                                                headers: {
                                                    'Content-type': 'application/json',
                                                    'Access-Control-Allow-Origin': '*'
                                                },
                                                body: JSON.stringify({
                                                    success: true,
                                                    message: 'bot created successfully',
                                                    data: dbParams.Item
                                                })
                                            }); 
                                        }).catch(error => callback(error));
                                }).catch(error => callback(error));    
                        }).catch(error => callback(error));
                }).catch(error => callback(error));
        }).catch(error => callback(error));
};