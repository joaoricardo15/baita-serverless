const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {

    const { user_id } = event.pathParameters;
    
    const queryParams = { 
        TableName: 'connections',
        KeyConditionExpression: '#user = :user',
        ProjectionExpression: '#user,#app,#connection,#name,#email',
        ExpressionAttributeNames: {
            '#user': 'user_id',
            '#app': 'app_id',
            '#connection': 'connection_id',
            '#name': 'name',
            '#email': 'email'
        },
        ExpressionAttributeValues: {
            ':user': user_id
        }
    };
    
    ddb.query(queryParams).promise()
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
        })
        .catch(error => callback(error));
};