const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {

    let input_data;

    try {
        input_data = JSON.parse(event.body);
    } catch (error) {
        input_data = event.body;
    }

    const { user_id, bot_id } = input_data;

    const queryParams = { 
        TableName: 'bots',
        Key: {
            "user_id": user_id,
            "bot_id": bot_id
        }
    };

    ddb.get(queryParams).promise()
        .then(data => {

            const samples = [];
            for (let i = 0; i < input_data.samples.length; i++)
                samples.push(data.Item.samples[i] ? data.Item.samples[i] : input_data.samples[i]);

            const dbParams = {
                TableName:'bots',
                Item: {
                    ...input_data,
                   samples, 
                }
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
        }).catch(error => callback(error));
};