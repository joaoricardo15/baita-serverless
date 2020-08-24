const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();
const s3 = new AWS.S3();

var JSZip = require("jszip");
var zip = new JSZip();

const BOTS_BUCKET = process.env.BOTS_BUCKET;
const FUNCTIONS_PREFIX = process.env.FUNCTIONS_PREFIX;

const comparationExpressions = {
    'equals': ' == ',
    'diferent': ' != ',
    'exists': '',
    'donotexists': ''
}

module.exports.handler = (event, context, callback) => {

    const input_data = JSON.parse(event.body);

    const { user_id, bot_id, tasks } =  input_data;

    if (!tasks || !tasks.length || tasks.length < 2 || tasks[0].type !== 'trigger')
        return callback(null, {
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

            const app = tasks[i].app;
            const service = tasks[i].service;

            let input_fields = '';
            if (service.service_config.input_source === 'service_fields')
                for (let j = 0; j < service.service_config.input_fields.length; j++) {
                    
                    const var_name = service.service_config.input_fields[j].var_name;

                    const input_field = tasks[i].input_data.find(x => x.var_name === var_name);

                    if (!service.service_name || !service.service_config || !tasks[i].input_data || !input_field)
                        return callback(null, {
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
                    else input_fields += `'${var_name}': ${tasks[i].input_data[j].value ? `\`${tasks[i].input_data[j].value}\`` : `task${tasks[i].input_data[j].output_index}_output_data['${tasks[i].input_data[j].output_name}']`},`
                }
            else if (service.service_config.input_source === 'input_fields')
                for (let j = 0; j < tasks[i].input_data.length; j++) {
                    input_fields += `'${tasks[i].input_data[j].var_name}': ${tasks[i].input_data[j].value ? `\`${tasks[i].input_data[j].value}\`` : `task${tasks[i].input_data[j].output_index}_output_data['${tasks[i].input_data[j].output_name}']`},`
                }

            let conditions = '';
            for (let j = 0; j < tasks[i].conditions.length; j++) {
                
                let andConditions = '';
                for (let k = 0; k < tasks[i].conditions[j].andConditions.length; k++) {
                    andConditions += `${k === 0 ? '' : ' && '}${tasks[i].conditions[j].andConditions[k].value ? 
                        `\`${tasks[i].conditions[j].andConditions[k].value}\`` : 
                        `${tasks[i].conditions[j].andConditions[k].comparation_type === 'donotexists' ? '!' : ''}task${tasks[i].conditions[j].andConditions[k].output_index}_output_data['${tasks[i].conditions[j].andConditions[k].output_name}']${comparationExpressions[tasks[i].conditions[j].andConditions[k].comparation_type]}${tasks[i].conditions[j].andConditions[k].comparation_value ? `'${tasks[i].conditions[j].andConditions[k].comparation_value}'` : ''}`}`
                }
                if (andConditions)
                    conditions += `${j === 0 ? '' : ' || '}(${andConditions})`;
            }
                
            innerCode +=  `
    const task${i}_name = '${tasks[i].service.name}';
    
    const task${i}_connection = ${JSON.stringify({
        user_id,
        connection_id: tasks[i].connection_id,
        app_config: app.app_config
    })};

    const task${i}_input_data = { ${input_fields} };

    const task${i}_config = ${JSON.stringify(service.service_config)};
    
    const task${i}_output_path = ${service.service_config.output_path ? `'${service.service_config.output_path}'` : 'undefined'};

    let task${i}_output_data;

    const task${i}_output_log = {
        name: task${i}_name,
        input_data: task${i}_input_data
    };

    if (${conditions ? conditions : true}) {
        const task${i}_response = await lambda.invoke({
            FunctionName: '${FUNCTIONS_PREFIX}-${service.service_name}',
            Payload: JSON.stringify({ connection: task${i}_connection, config: task${i}_config, input_data: task${i}_input_data, output_path: task${i}_output_path }),
        }).promise();
    
        const task${i}_result = JSON.parse(task${i}_response.Payload);

        const task${i}_success = task${i}_result.success;

        const task${i}_timestamp = Date.now();
        
        task${i}_output_data = task${i}_success && task${i}_result.data ? task${i}_result.data : { message: task${i}_result.message || task${i}_result.errorMessage || 'nothing for you this time : (' };

        if (task${i}_success) usage += 1;

        task${i}_output_log['output_data'] = task${i}_output_data;
        task${i}_output_log['timestamp'] = task${i}_timestamp;
        task${i}_output_log['status'] = task${i}_success ? 'success' : 'fail';
    } else {
        const task${i}_timestamp = Date.now();
        
        task${i}_output_log['timestamp'] = task${i}_timestamp;
        task${i}_output_log['status'] = 'filtered';
    }

    logs.push(task${i}_output_log);
    ${tasks[i].bot_output ? `\noutput_data = task${i}_output_data;\n\n` : ''}`
        }

        const bot_code = `
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: "us-east-1" });

module.exports.handler = async (event, context, callback) => {

    const user_id = '${user_id}';
    const bot_id = '${bot_id}';

    let usage = 0;
    const logs = [];
    let error_result;
    let output_data;

    try {
        
        const task0_name = '${tasks[0].service.name}';

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
            status: 'success'
        });
${innerCode}
    } catch (error) {
        error_result = error;
    }
    
    await lambda.invoke({
        FunctionName: '${FUNCTIONS_PREFIX}-log-create',
        Payload: JSON.stringify({ user_id, bot_id, usage, logs, error: error_result })
    }).promise();

    callback(null, {
        statusCode: 200,
        headers: {
            'Content-type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            success: true,
            ...output_data
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