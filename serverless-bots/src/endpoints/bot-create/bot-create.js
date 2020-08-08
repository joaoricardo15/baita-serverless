const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {

    const triggerInput = JSON.parse(event.body);

    const { user_id, email, name, } = triggerInput;

    var params = {
        TableName:'users',
        Item: {
            id: user_id.split('|')[1],
            name,
            email
        }
    };
            
    ddb.put(params).promise()
        .then(() => {
            callback(null, {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: 'user created successfully'
                })
            });
        })
        .catch(error => {
            callback(error);
        });
};