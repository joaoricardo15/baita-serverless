const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

const BOTS_TABLE = process.env.BOTS_TABLE;

module.exports.handler = (event, context, callback) => {

    const { user_id } = event.pathParameters;
    
    const params = { 
        TableName: BOTS_TABLE,
        KeyConditionExpression: "user_id = :id",
        ExpressionAttributeValues: {
            ":id": user_id
        },
    };

    ddb.query(params).promise()
        .then(query_result => {
            callback(null, {
                statusCode: 200,
                headers: {
                    'Content-type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    data: query_result.Items
                })
            })
        }).catch(callback);
};