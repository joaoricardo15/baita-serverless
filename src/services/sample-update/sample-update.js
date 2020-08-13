const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

module.exports.handler = (event, context, callback) => {  

    const { user_id, bot_id, task_index, input_data, output_data } = event;

    const timestamp = new Date().toString();

    const sample = {
        input_data,
        output_data,
        timestamp
    };

    const sample_params = {
        TableName:"bots",
        Key:{
            "bot_id": bot_id,
            "user_id": user_id
        },
        ReturnValues:"ALL_NEW"
    };

    if (task_index == 0) {
        sample_params.UpdateExpression = `set #smp[${task_index}].sample_results = list_append(if_not_exists(#smp.sample_results, :empty_list), :sample)`;
        sample_params.ExpressionAttributeNames = {
            "#smp": 'samples'
        };
        sample_params. ExpressionAttributeValues = {
            ":sample": [sample],
            ":empty_list": []
        };
    }
    else {
        sample_params.UpdateExpression = `set #smp[${task_index}].sample_result = :sample`;
        sample_params.ExpressionAttributeNames = {
            "#smp": 'samples'
        };
        sample_params. ExpressionAttributeValues = {
            ":sample": sample,
        };
    }

    ddb.update(sample_params).promise()
        .then(result => {
            callback(null, {  
                success: true, 
                data: result.Attributes 
            });
        }).catch(err => callback(err));
};
