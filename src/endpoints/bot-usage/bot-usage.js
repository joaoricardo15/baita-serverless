const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {

    const { bot_id } = event.pathParameters;
            
    const scanParams = { 
        TableName: 'logs',
        ProjectionExpression: '#usg',
        KeyConditionExpression: "#id = :id",
        ExpressionAttributeNames: {
            "#id": "bot_id",
            "#usg": "usage"
        },
        ExpressionAttributeValues: {
            ":id": bot_id
        },
    };

    let scan_result = { total: 0 };

    ddb.query(scanParams, onQuery);

    function onQuery(err, query) {
        if (err) callback(error)
        else {        

            query.Items.forEach(item => {
                scan_result.total += item.usage;
            });

            if (typeof query.LastEvaluatedKey != "undefined") {
                scanParams.ExclusiveStartKey = query.LastEvaluatedKey;
                ddb.query(scanParams, onQuery);
            } else {
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
            }
                
        }
    }
};