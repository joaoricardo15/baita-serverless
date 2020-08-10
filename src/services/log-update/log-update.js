const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {  

    const { id, bot_id, name, input_data, output_data } = event;

    const timestamp = Date.now();

    const outputResultData = output_data.errorMessage ? { message: output_data.errorMessage } : output_data.data ? output_data.data : {};
    const success = output_data.errorMessage ? false : true;
    const log = {
        name,
        input_data,
        output_data: outputResultData,
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