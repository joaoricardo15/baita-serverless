const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();
const s3 = new AWS.S3();

var JSZip = require("jszip");
var zip = new JSZip();

const BOTS_BUCKET = process.env.BOTS_BUCKET;
const FUNCTIONS_PREFIX = process.env.FUNCTIONS_PREFIX;

module.exports.handler = (event, context, callback) => {

    const input_data = JSON.parse(event.body);

    const { user_id, bot_id, tasks } =  input_data;

    if (!tasks || !tasks.length || tasks.length < 2 || tasks[0].type !== 'trigger')
        callback(null, {
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
    else {

        let innerCode = '';

        for (let i = 1; i < tasks.length; i++) {

            let input_fields = '';
            for (let j = 0; j < tasks[i].service_data.input_fields.length; j++) {
                const var_name = tasks[i].service_data.input_fields[j].var_name;
                if (!tasks[i].service_name || !tasks[i].service_config)
                    callback(null, {
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
                else if (tasks[i].input_data && tasks[i].input_data[var_name])
                    input_fields += `'${var_name}': ${tasks[i].input_data[var_name]},`
            }
                
            innerCode +=  `
    const task${i}_name = '${tasks[i].name}';
    
    const task${i}_input_data = {
      ${input_fields}
    };

    const task${i}_config = ${JSON.stringify(tasks[i].service_config)};
    
    const task${i}_response = await lambda.invoke({
      FunctionName: '${FUNCTIONS_PREFIX}-${tasks[i].service_name}',
      Payload: JSON.stringify({ config: task${i}_config, input_data: task${i}_input_data }),
    }).promise();
    
    const task${i}_result = JSON.parse(task${i}_response.Payload);

    const task${i}_success = task${i}_result.success;

    const task${i}_output_data = task${i}_success ? task${i}_result.data : { message: task${i}_result.message || task${i}_result.errorMessage || 'nothing for you this time : (' };
    
    const task${i}_timestamp = Date.now();

    logs.push({
        name: task${i}_name,
        input_data: task${i}_input_data,
        output_data: task${i}_output_data,
        timestamp: task${i}_timestamp,
        success: task${i}_success
    });

    ${tasks[i].bot_output ? `output_data = task${i}_output_data;` : ''}`
        }

        const bot_code = `
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: "us-east-1" });

module.exports.handler = async (event, context, callback) => {

    const user_id = '${user_id}';
    const bot_id = '${bot_id}';

    const logs = [];
    let output_data;

    const task0_name = '${tasks[0].name}';

    let task0_output_data;
    
    if (event.body)
        try {
            task0_output_data = JSON.parse(event.body);
        } catch (error) {
            task0_output_data = event.body;
        }

    const task0_timestamp = Date.now();

    logs.push({
        name: task0_name,
        output_data: task0_output_data,
        timestamp: task0_timestamp,
        success: true
    });
${innerCode}
    lambda.invoke({
        FunctionName: '${FUNCTIONS_PREFIX}-log-create',
        Payload: JSON.stringify({ user_id, bot_id, logs })
    }).promise();

    callback(null, {
        statusCode: 200,
        headers: {
            'Content-type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            success: true,
            data: output_data
        })
    }); 
};
`

        zip.file("index.js", bot_code);
        zip.generateAsync({ type: "base64" })
            .then(package => {
            
                const buffer = new Buffer.from(package, 'base64');
                const bucketParams = {
                    Bucket: BOTS_BUCKET,
                    Key: `${bot_id}.zip`,
                    Body: buffer
                };

                s3.upload(bucketParams).promise()
                    .then(bucket => {
                        
                        const lambdaParams = {
                            FunctionName: bot_id,
                            S3Bucket: BOTS_BUCKET,
                            S3Key: `${bot_id}.zip`
                        };

                        lambda.updateFunctionCode(lambdaParams).promise()
                            .then(lambda => {

                                const dbParams = {
                                    TableName:"bots",
                                    Key:{
                                        "bot_id": bot_id,
                                        "user_id": user_id
                                    },
                                    UpdateExpression: 'set #tk = :tk, #act = :act',
                                    ExpressionAttributeNames: {
                                        "#tk": 'tasks',
                                        "#act": 'active'
                                    },
                                    ExpressionAttributeValues: {
                                        ":tk": tasks,
                                        ":act": true
                                    },
                                    ReturnValues:"ALL_NEW"
                                };

                                ddb.update(dbParams).promise()
                                    .then(data => {
                                        callback(null, {
                                            statusCode: 200,
                                            headers: {
                                                'Content-type': 'application/json',
                                                'Access-Control-Allow-Origin': '*'
                                            },
                                            body: JSON.stringify({
                                                success: true,
                                                message: 'bot created successfully',
                                                data: data.Attributes
                                            })
                                        });
                                    }).catch(error => callback(error));    
                            }).catch(error => callback(error));
                    }).catch(error => callback(error));
            }).catch(error => callback(error));
    }
};