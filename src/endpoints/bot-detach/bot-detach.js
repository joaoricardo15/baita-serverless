const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();
const s3 = new AWS.S3();

var JSZip = require("jszip");
var zip = new JSZip();

const BOTS_BUCKET = process.env.BOTS_BUCKET;
const FUNCTIONS_PREFIX = process.env.FUNCTIONS_PREFIX;

module.exports.handler = (event, context, callback) => {

    const input_data = JSON.parse(event.body);

    const { user_id, bot_id, tasks } =  input_data;

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
        FunctionName: '${FUNCTIONS_PREFIX}-sample-update',
        Payload: JSON.stringify({ user_id, bot_id, task_index: 0, output_data: task0_output_data })
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
                        S3Bucket: BOTS_BUCKET,
                        S3Key: `${bot_id}.zip`
                    };

                    lambda.updateFunctionCode(lambdaParams).promise()
                        .then(lambda => {

                            const dbParams = {
                                TableName:"bots",
                                Key:{
                                    "bot_id": bot_id,
                                    "user_id": user_id
                                },
                                UpdateExpression: 'set #tk = :tk, #act = :act',
                                ExpressionAttributeNames: {
                                    "#tk": 'tasks',
                                    "#act": 'active'
                                },
                                ExpressionAttributeValues: {
                                    ":tk": tasks,
                                    ":act": false
                                },
                                ReturnValues:"ALL_NEW"
                            };

                            ddb.update(dbParams).promise()
                                .then(data => {
                                    callback(null, {
                                        statusCode: 200,
                                        headers: {
                                            'Content-type': 'application/json',
                                            'Access-Control-Allow-Origin': '*'
                                        },
                                        body: JSON.stringify({
                                            success: true,
                                            message: 'bot created successfully',
                                            data: data.Attributes
                                        })
                                    });
                                }).catch(error => callback(error));    
                        }).catch(error => callback(error));
                }).catch(error => callback(error));
        }).catch(error => callback(error));
};