const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

const USERS_TABLE = process.env.USERS_TABLE;

module.exports.handler = (event, context, callback) => {

    const input_data = JSON.parse(event.body);

    const { user_id, email, name, } = input_data;

    var params = {
        TableName: USERS_TABLE,
        Item: {
            user_id: user_id.split('|')[1],
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
        .catch(error => callback(error));
};