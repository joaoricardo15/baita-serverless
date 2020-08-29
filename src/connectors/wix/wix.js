const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const Axios = require('axios');

const BOTS_TABLE = process.env.BOTS_TABLE;
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;
const WIX_AUTH_URL = process.env.WIX_AUTH_URL;
const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID;
const WIX_CLIENT_SECRET = process.env.WIX_CLIENT_SECRET;

module.exports.handler = (event, context, callback) => {

    const { code, state, instanceId } = event.queryStringParameters;

    const callback_payload = {
        statusCode: 200,
        headers: {
            'Content-type': 'text/html'
        },
        body: '<script>window.close()</script>'
    }

    const app_id = state.split(':')[0];
    const user_id = state.split(':')[1];
    const bot_id = state.split(':')[2];
    const task_index = state.split(':')[3];

    const data = {
        code,
        'grant_type': 'authorization_code',
        'client_id': WIX_CLIENT_ID,
        'client_secret': WIX_CLIENT_SECRET,
    };

    const headers = {
        'Content-Type': 'application/json'
    };

    Axios({
        method: 'post',
        url: WIX_AUTH_URL,
        headers,
        data
    }).then(credentials_result => {

            if (credentials_result.message || credentials_result.errorMessage)
                return callback(null, callback_payload);
            else if (credentials_result.data) {
                
                const credentials = credentials_result.data;

                Axios({
                    method: 'post',
                    url: 'https://www.wix.com/_api/site-apps/v1/site-apps/token-received', 
                    headers: { 
                        'Authorization': `Bearer ${credentials.access_token}` 
                    } 
                }).then(instalation_finish_step_result => {
                    
                        if (instalation_finish_step_result.message || instalation_finish_step_result.errorMessage)
                            return callback(null, callback_payload);
                        else {

                            Axios({
                                method: 'get',
                                url: 'https://www.wixapis.com/apps/v1/instance', 
                                headers: { 
                                    'Authorization': `Bearer ${credentials.access_token}` 
                                } 
                            }).then(user_result => {
                            
                                if (user_result.message || user_result.errorMessage)
                                    return callback(null, callback_payload);
                                else if (user_result.data) {

                                    const bot_params = {
                                        TableName: BOTS_TABLE,
                                        Key:{
                                            "bot_id": bot_id,
                                            "user_id": user_id
                                        },
                                        UpdateExpression: `set #tks[${task_index}].connection_id = :id`,
                                        ExpressionAttributeNames: {
                                            "#tks": 'tasks',
                                        },
                                        ExpressionAttributeValues: {
                                            ":id": connection_id,
                                        },
                                        ReturnValues:"ALL_NEW"
                                    };

                                    ddb.update(bot_params).promise()
                                        .then(() => {
                                            const { appName: name } = user_result.data.instance;

                                            const connection_id = instanceId.toString();
                                            
                                            const connection_params = {
                                                TableName: CONNECTIONS_TABLE,
                                                Item: {
                                                    name,
                                                    app_id,
                                                    user_id,
                                                    credentials,
                                                    connection_id
                                                }
                                            };
        
                                            ddb.put(connection_params).promise()
                                                .then(() => {
                                                    callback(null, callback_payload);
                                                }).catch(error => callback(null, callback_payload));
                                        }).catch(error => callback(null, callback_payload));
                                    }
                            }).catch(error => callback(null, {
                                statusCode: 200,
                                headers: { 'Content-type': 'text/html' },
                                body: JSON.stringify(error.response.data)
                            }));
                        }
                }).catch(error => callback(null, {
                    statusCode: 200,
                    headers: { 'Content-type': 'text/html' },
                    body: JSON.stringify(error.response.data)
                }));
            }
    }).catch(error => callback(null, {
        statusCode: 200,
        headers: { 'Content-type': 'text/html' },
        body: JSON.stringify(error.response.data)
    }));
};