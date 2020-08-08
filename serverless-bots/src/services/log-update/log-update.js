const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {

    const { id, name, user_id, bot_id, input_data, output_data } = event;

    const timestamp = Date.now();

    const success = true;

    const log = {
        name,
        input_data,
        output_data,
        success,
        timestamp
    }

    const params = {
        TableName:'logs',
        Key:{
            "bot_id": bot_id,
            "timestamp": id
        },
        UpdateExpression: "set roomAlias=:r",
        ExpressionAttributeValues:{
            ":r": newRoomName
        },
        ReturnValues:"UPDATED_NEW"
    };

    ddb.update(params).promise()
        .then(() => callback(null, { success: true }))
        .catch(error => callback(error));
}

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {  

    const { id, bot_id, name, input_data, output_data } = event;

    const timestamp = Date.now();

    const outputResultData = outputData.errorMessage ? { message: outputData.errorMessage } : outputData.data ? outputData.data : {};
    const success = outputData.errorMessage ? false : true;
    const log = {
        name,
        inputData,
        outputData: outputResultData,
        success,
        timestamp,
    };

    const log_params = {
        TableName:"logs",
        Key:{
            "bot_id": bot_id,
            "timestamp": id
        },
        UpdateExpression: "set logs = list_append(if_not_exists(logs, :empty_list), :log)",
        ExpressionAttributeValues:{
            ":log": [log],
            ":empty_list": []
        },
        ReturnValues:"UPDATED_NEW"
    };

    ddb.update(log_params).promise()
        .then(() => callback(null, { success: true }))
        .catch(err => callback(err));
};