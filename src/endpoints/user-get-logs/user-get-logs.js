const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {

    const { bot_id } = event.queryStringParameters;
    
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
            
            const scanParams = { 
                TableName: 'logs',
                ProjectionExpression: 'logs',
                FilterExpression: "bot_id = :id",
                ExpressionAttributeValues: {
                    ":id": bot_id
                },
            };

            ddb.scan(scanParams).promise()
                .then(scan => {

                    let total = 0;
                    for (let i = 0; i < scan.Items.length; i++)
                        total += scan.Items[i].logs.length;

                    callback(null, {
                        statusCode: 200,
                        headers: {
                            'Content-type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify({
                            success: true,
                            data: {                       
                                total: total,
                                logs: log.Items,
                                last_run: log.Items.length ? log.Items[0].timestamp : undefined
                            }
                        })
                    })
                }).catch(error => callback(error));
        }).catch(error => callback(error));
};