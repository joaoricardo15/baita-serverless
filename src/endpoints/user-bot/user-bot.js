const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {

    const { user_id, bot_id } = event.pathParameters;
            
    const getParams = { 
        TableName: 'bots',
        Key: {
            "user_id": user_id,
            "bot_id": bot_id
        }
    };

    ddb.get(getParams).promise()
        .then(get_result => {

            callback(null, {
                statusCode: 200,
                headers: {
                    'Content-type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    data: get_result.Item
                })
            })
        }).catch(error => callback(error));
};