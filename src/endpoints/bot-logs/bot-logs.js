const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {

    const { bot_id } = event.pathParameters;
    
    const queryParams = { 
        TableName: 'logs',
        Limit:20,
        KeyConditionExpression: "bot_id = :id",
        ExpressionAttributeValues: {
            ":id": bot_id
        },
        ScanIndexForward: false
    };
    
    ddb.query(queryParams).promise()
        .then(log => {
            callback(null, {
                statusCode: 200,
                headers: {
                    'Content-type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    data: log.Items
                })
            })
        }).catch(error => callback(error));
};