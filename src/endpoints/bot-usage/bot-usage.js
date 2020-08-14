const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {

    const { bot_id } = event.pathParameters;
            
    const scanParams = { 
        TableName: 'logs',
        ProjectionExpression: '#lgs,#tst',
        FilterExpression: "#id = :id",
        ExpressionAttributeNames: {
            "#id": "bot_id",
            "#lgs": "logs",
            "#tst": "timestamp"
        },
        ExpressionAttributeValues: {
            ":id": bot_id
        },
    };

    ddb.scan(scanParams).promise()
        .then(scan => {

            let scan_result = { total: 0 };
            if (scan.Items && scan.Items.length) {
                for (let i = 0; i < scan.Items.length; i++)
                    scan_result.total += scan.Items[i].logs.length - 1;
                
                scan_result['last_run'] = scan.Items[scan.Items.length -1].timestamp
                scan_result['first_run'] = scan.Items[0].timestamp
            }

            callback(null, {
                statusCode: 200,
                headers: {
                    'Content-type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    data: scan_result
                })
            })
        }).catch(error => callback(error));
};