const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const apigateway = new AWS.ApiGatewayV2();
const lambda = new AWS.Lambda();
const s3 = new AWS.S3();

var JSZip = require("jszip");
var zip = new JSZip();

const BOTS_BUCKET = process.env.BOTS_BUCKET;
const FUNCTIONS_PREFIX = process.env.FUNCTIONS_PREFIX;

module.exports.handler = (event, context, callback) => {

    const input_data = JSON.parse(event.body);

    const { user_id, bot_id, tasks } =  input_data;

    let innerCode = '';

    for (let i = 0; i < tasks.length; i++) {
        innerCode +=  `

    const { cpf } = trigger_data;

    let formatedCpf = cpf + "";
  
    if (formatedCpf.includes(".") || formatedCpf.includes("-") || formatedCpf.includes(" ") || formatedCpf.includes(",")) {
        formatedCpf = formatedCpf.split(".").join("");
        formatedCpf = formatedCpf.split("-").join("");
        formatedCpf = formatedCpf.split(" ").join("");
        formatedCpf = formatedCpf.split(",").join("");
    }

    const action${i}Name = '${tasks[i].name}';
    const action${i}ApiToken = "0477aec73fcc3a5518dce98e4ae95ce346540e5f";
    
    const action${i}Input = {
      field_name: "cpf",
      search_term: formatedCpf
    };
    
    const action${i}Response = await lambda.invoke({
      FunctionName: 'action_pipedrive-search-person',//'${FUNCTIONS_PREFIX}-${tasks[i].functionName}',
      Payload: JSON.stringify({ api_token: action${i}ApiToken, payload: action${i}Input }),
    }).promise();
    
    const action${i}Result = JSON.parse(action${i}Response.Payload);
    
    await lambda.invoke({
      FunctionName: '${FUNCTIONS_PREFIX}-log-update',
      Payload: JSON.stringify({ id: logSet_id, user_id, bot_id, name: action${i}Name, input_data: action${i}Input, output_data: action${i}Result })
    }).promise();

    ${true && `output_data = action${i}Result;`}
`
    }

    const bot_code = `
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: "us-east-1" });

const user_id = '${user_id}';
const bot_id = '${bot_id}';
let output_data;

module.exports.handler = async (event, context, callback) => {

    const trigger_name = 'webhook';
    let trigger_data;
    
    if (event.body)
        try {
            trigger_data = JSON.parse(event.body);
        } catch (error) {
            trigger_data = event.body;
        }
    
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
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
            success: true,
            data: output_data
        })
    }); 
}
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
                                            "Access-Control-Allow-Origin": "*",
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
};