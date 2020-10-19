const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: "us-east-1" });

const SERVICE_PREFIX = process.env.SERVICE_PREFIX;

exports.handler = async (event, context, callback) => {

    const { connection, config, input_data, output_path } = event;

    const task0_response = await lambda.invoke({
        FunctionName: `${SERVICE_PREFIX}-oauth2-request`,
        Payload: JSON.stringify({ connection, config, input_data, output_path })
    }).promise();

    const task0_result = JSON.parse(task0_response.Payload);

    const task0_success = task0_result.success;

    const task0_output_data = task0_success && task0_result.data ? task0_result.data : { message: task0_result.message || task0_result.errorMessage || 'nothing for you this time : (' };

    if (task0_success && task0_output_data) {

        console.log(task0_output_data)

        const confHttp = { 
            "config": {
                "url": "https://api.pipedrive.com/v1/persons/search", 
                  "method": "GET",
                  "auth": {
                    "api_token": "0477aec73fcc3a5518dce98e4ae95ce346540e5f"
                },
                "query_params": [
                    { "value": 0, "var_name": "start" },
                    { "var_name": "api_token", "service_auth": "api_token" },
                    { "var_name": "term", "input_field": "search_term" },
                    { "var_name": "fields", "input_field": "field_name" }
                ]
            },
            "input_data": {
                "search_term": "12345678910",
                "field_name": "custom_fields"
            },
            "output_path": "string:data.string:items.number:0"
        }

    }
};
