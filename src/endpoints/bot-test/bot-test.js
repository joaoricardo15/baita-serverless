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

    const { user_id, bot_id, task, task_index } = test_input_data;

    const app = task.app;
    const service = task.service;

    const connection = {
        user_id,
        connection_id: task.connection_id,
        app_config: app.app_config
    }

    let service_input_data = {};

    if (service.service_config.input_source === 'service_fields')
        for (let i = 0; i < service.service_config.input_fields.length; i++) {
            const var_name = service.service_config.input_fields[i].var_name;
            console.log(task.input_data)
            const input_field = task.input_data.find(x => x.var_name === var_name);

            if (!service.service_name || !service.service_config || !task.input_data || !input_field)
                return callback(null, {
                    statusCode: 200,
                    headers: {
                        'Content-type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        message: 'invalid bot config'
                    })
                });
                
            else service_input_data[var_name] = input_field.sample_value;
        }
    else if (service.service_config.input_source === 'input_fields')
        for (let i = 0; i < task.input_data.length; i++) {
            service_input_data[task.input_data[i].var_name] = task.input_data[i].sample_value;
        }

    lambda.invoke({
      FunctionName: `${FUNCTIONS_PREFIX}-${service.service_name}`,
      Payload: JSON.stringify({ connection, config: service.service_config, input_data: service_input_data, output_path: service.service_config.output_path }),
    }).promise()
        .then(task_tesponse => {
            
            const task_result = JSON.parse(task_tesponse.Payload);

            const task_success = task_result.success;

            const task_output_data = task_success && task_result.data ? task_result.data : { message: task_result.message || task_result.errorMessage || 'nothing for you this time : (' };

            lambda.invoke({
                FunctionName: `${FUNCTIONS_PREFIX}-sample-update`,
                Payload: JSON.stringify({ user_id, bot_id, task_index, input_data: service_input_data, output_data: task_output_data })
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
