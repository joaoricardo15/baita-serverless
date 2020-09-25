const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const ddb = new AWS.DynamoDB.DocumentClient();

const BOTS_TABLE = process.env.BOTS_TABLE;
const SERVICE_PREFIX = process.env.SERVICE_PREFIX;

module.exports.handler = (event, context, callback) => {

    console.log(event)

    return callback(null, {
        statusCode: 200,
        headers: {
            'Content-type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            success: true,
            data: event
        })
    });

    let webhook_input_data;
    
    try {
        webhook_input_data = JSON.parse(event.body);
    } catch (error) {
        webhook_input_data = event.body;
    }

    const { instanceId, eventType } = webhook_input_data;

    const scanParams = { 
        TableName: BOTS_TABLE,
        // Limit:20,
        // KeyConditionExpression: "bot_id = :id",
        // ExpressionAttributeValues: {
        //     ":id": bot_id
        // },
        // ScanIndexForward: false
    };
    
    ddb.query(scanParams).promise()
        .then(log => {

            const { user_id, bot_id, task_index } = webhook_input_data;

            lambda.invoke({
                FunctionName: `${SERVICE_PREFIX}-bot-${bot_id}`,
                Payload: JSON.stringify({ test_task_index: task_index })
            }).promise()
                .then(task_tesponse => {
                    
                    const invoke_result = JSON.parse(task_tesponse.Payload);
                    
                    const task_result = JSON.parse(invoke_result.body);

                    const task_success = task_result.success;

                    const task_output_data = task_success && task_result.data ? task_result.data : { message: task_result.message || task_result.errorMessage || 'nothing for you this time : (' };

                    lambda.invoke({
                        FunctionName: `${SERVICE_PREFIX}-sample-update`,
                        Payload: JSON.stringify({ user_id, bot_id, task_index, status: task_output_data.status, input_data: task_output_data.input_data, output_data: task_output_data.output_data })
                    }).promise()
                        .then(update_response => {
                
                            const update_result = JSON.parse(update_response.Payload);

                            callback(null, {
                                statusCode: 200,
                                headers: {
                                    'Content-type': 'application/json',
                                    'Access-Control-Allow-Origin': '*'
                                },
                                body: JSON.stringify({
                                    success: true,
                                    data: update_result.data
                                })
                            });
                        }).catch(callback);
                }).catch(callback);
        }).catch(callback);
};
