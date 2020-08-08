const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {

    const { user_id } = event.queryStringParameters;
    
    const params = { 
        TableName: 'bots',
        KeyConditionExpression: "user_id = :id",
        ExpressionAttributeValues: {
            ":id": user_id
        },
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
            callback(JSON.stringify(error));
        });
};