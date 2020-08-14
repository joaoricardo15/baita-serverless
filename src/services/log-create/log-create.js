const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {  

    const { user_id, bot_id, logs } = event;

    const timestamp = Date.now();
    
    const log_set = {
        bot_id,
        user_id, 
        timestamp,
        logs
    };
        
    const logParams = {
        TableName:'logs',
        Item: log_set
    };
                    
    ddb.put(logParams).promise()
        .then(() => callback(null, { success: true }))
        .callback({ success: false, ...error });
}