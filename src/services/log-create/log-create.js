const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {  

    const { user_id, bot_id, name, output_data } = event;

    const timestamp = Date.now();

    const outputResultData = output_data.errorMessage ? { message: output_data.errorMessage } : output_data.data ? output_data.data : {};
    const success = output_data.errorMessage ? false : true;
    const log = {
        name,
        output_data: outputResultData,
        success,
        timestamp,
    };
    
    const logSet = {
        bot_id,
        user_id, 
        timestamp,
        logs: [log]
    };
        
    var params = {
        TableName:'logs',
        Item: logSet
    };
                    
    ddb.put(params).promise()
        .then(() => callback(null, { success: true, data: { logSet_id: timestamp } }))
        .catch(err => callback(err));
};