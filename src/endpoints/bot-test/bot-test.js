const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: "us-east-1" });

const FUNCTIONS_PREFIX = process.env.FUNCTIONS_PREFIX;

module.exports.handler = (event, context, callback) => {

    let test_input_data;
    
    try {
        test_input_data = JSON.parse(event.body);
    } catch (error) {
        test_input_data = event.body;
    }

    const { user_id, bot_id, task_index, task_name, task_data, input_data } = test_input_data;

    lambda.invoke({
      FunctionName: `${FUNCTIONS_PREFIX}-${task_name}`,
      Payload: JSON.stringify({ task_data, input_data }),
    }).promise()
        .then(task_tesponse => {
            
            const task_result = JSON.parse(task_tesponse.Payload).data;

            lambda.invoke({
                FunctionName: `${FUNCTIONS_PREFIX}-sample-update`,
                Payload: JSON.stringify({ user_id, bot_id, task_index, input_data, output_data: task_result })
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
                }).catch(error => callback(error));
        }).catch(error => callback(error));
};
