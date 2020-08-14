const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

const FUNCTIONS_PREFIX = process.env.FUNCTIONS_PREFIX;

module.exports.handler = (event, context, callback) => {

    let test_input_data;
    
    try {
        test_input_data = JSON.parse(event.body);
    } catch (error) {
        test_input_data = event.body;
    }

    const { user_id, bot_id, task_index, service_name, service_config, input_data } = test_input_data;

    lambda.invoke({
      FunctionName: `${FUNCTIONS_PREFIX}-${service_name}`,
      Payload: JSON.stringify({ config: service_config, input_data }),
    }).promise()
        .then(task_tesponse => {
            
            const task_result = JSON.parse(task_tesponse.Payload);

            const task_success = task_result;

            const task_output_data = task_success ? task_result.data : { message: task_result.message || task_result.errorMessage || 'nothing for you this time : (' };
    
            lambda.invoke({
                FunctionName: `${FUNCTIONS_PREFIX}-sample-update`,
                Payload: JSON.stringify({ user_id, bot_id, task_index, input_data, output_data: task_output_data })
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
