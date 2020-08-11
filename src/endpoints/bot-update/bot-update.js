const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {

    let input_data;

    try {
        input_data = JSON.parse(event.body);
    } catch (error) {
        input_data = event.body;
    }

    const dbParams = {
        TableName:'bots',
        Item: input_data
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
                    message: 'bot updated successfully',
                    data: dbParams.Item
                })
            }); 
    }).catch(error => callback(error));
};