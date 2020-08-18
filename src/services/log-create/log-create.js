const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {  

    const { user_id, bot_id, logs, error } = event;

    const timestamp = Date.now();
    
    const log_set = {
        bot_id,
        user_id,
        error,
        timestamp,
        logs
    };
        
    const logParams = {
        TableName:'logs',
        Item: log_set
    };
                    
    ddb.put(logParams).promise()
        .then(() => callback(null, { success: true }))
        .catch(error => callback({ success: false, ...error }));
}