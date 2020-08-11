const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {  

    const { user_id, bot_id, name, output_data } = event;

    const timestamp = Date.now();

    const result_output_data = output_data.errorMessage ? { message: output_data.errorMessage } : output_data.data ? output_data.data : {};
    const success = output_data.errorMessage ? false : true;
    const log = {
        name,
        output_data: result_output_data,
        success,
        timestamp,
    };
    
    const log_set = {
        bot_id,
        user_id, 
        timestamp,
        logs: [log]
    };
        
    const log_params = {
        TableName:'logs',
        Item: log_set
    };
                    
    ddb.put(log_params).promise()
        .then(() => callback(null, { success: true, data: { logSet_id: timestamp } }))
        .catch(err => callback(err));
}