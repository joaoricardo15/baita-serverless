const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {  

    const { user_id, bot_id, name, outputData } = event;

    const timestamp = Date.now();

    const outputResultData = outputData.errorMessage ? { message: outputData.errorMessage } : outputData.data ? outputData.data : {};
    const success = outputData.errorMessage ? false : true;
    const log = {
        name,
        outputData: outputResultData,
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