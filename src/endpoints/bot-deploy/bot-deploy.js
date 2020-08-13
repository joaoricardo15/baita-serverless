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
        callback('invalid bot config');
    else {

        let innerCode = '';

        for (let i = 1; i < tasks.length; i++) {

            let input_fields = '';
            for (let j = 0; j < tasks[i].service_data.input_fields.length; j++)
                input_fields += `'${tasks[i].service_data.input_fields[j].variable_name}': trigger_data['${tasks[i].service_data.input_fields[j].variable_name}'],`

            innerCode +=  `

    const action${i}_name = '${tasks[i].name}';
    
    const action${i}_input_data = {
      ${input_fields}
    };

    const action${i}_config = ${JSON.stringify(tasks[i].service_config)};
    
    const action${i}_response = await lambda.invoke({
      FunctionName: '${FUNCTIONS_PREFIX}-${tasks[i].service_name}',
      Payload: JSON.stringify({ config: action${i}_config, input_data: action${i}_input_data }),
    }).promise();
    
    const action${i}_output_data = JSON.parse(action${i}_response.Payload);
    
    await lambda.invoke({
      FunctionName: '${FUNCTIONS_PREFIX}-log-update',
      Payload: JSON.stringify({ id: logSet_id, user_id, bot_id, name: action${i}_name, input_data: action${i}_input_data, output_data: action${i}_output_data })
    }).promise();

    ${tasks[i].bot_output ? `output_data = action${i}_output_data;` : ''}`
        }

        const bot_code = `
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: "us-east-1" });

const user_id = '${user_id}';
const bot_id = '${bot_id}';
let output_data;

module.exports.handler = async (event, context, callback) => {

    const trigger_name = '${tasks[0].name}';

    let trigger_data;
    
    if (event.body)
        try {
            trigger_data = JSON.parse(event.body);
        } catch (error) {
            trigger_data = event.body;
        }
    
    await lambda.invoke({
        FunctionName: '${FUNCTIONS_PREFIX}-sample-update',
        Payload: JSON.stringify({ user_id, bot_id, task_index: 0, output_data: trigger_data })
    }).promise();

    const logSet = await lambda.invoke({
        FunctionName: '${FUNCTIONS_PREFIX}-log-create',
        Payload: JSON.stringify({ user_id, bot_id, name: trigger_name, output_data: { success: true, data: trigger_data } })
    }).promise();

    const logCreationResult = JSON.parse(logSet.Payload);
    const logSet_id = logCreationResult.data && logCreationResult.data.logSet_id;
${innerCode}
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
                                    TableName:'bots',
                                    Item: input_data
                                };

                                ddb.put(dbParams).promise()
                                    .then(() => {
                                        callback(null, {
                                            statusCode: 200,
                                            headers: {
                                                'Content-type': 'application/json',
                                                'Access-Control-Allow-Origin': '*'
                                            },
                                            body: JSON.stringify({
                                                success: true,
                                                message: 'bot created successfully',
                                                data: dbParams.Item
                                            })
                                        }); 
                                    }).catch(error => callback(error));    
                            }).catch(error => callback(error));
                    }).catch(error => callback(error));
            }).catch(error => callback(error));
    }
};