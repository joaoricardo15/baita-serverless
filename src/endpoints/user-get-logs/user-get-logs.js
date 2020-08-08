const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {

    const { bot_id } = event.queryStringParameters;
    
    const params = { 
        TableName: 'logs',
        Limit:20,
        KeyConditionExpression: "bot_id = :id",
        ExpressionAttributeValues: {
            ":id": bot_id
        },
        ScanIndexForward: false
    };
    
    ddb.query(params).promise()
        .then(data => {
            callback(null, {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({
                    success: true,
                    data: data.Items
                })
            })
        })
        .catch(error => {
            callback(error);
        });
};