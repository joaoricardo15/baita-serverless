const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const Axios = require('axios');

const BOTS_TABLE = process.env.BOTS_TABLE;
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;
const RDSTATION_AUTH_URL = process.env.RDSTATION_AUTH_URL;
const RDSTATION_CLIENT_ID = process.env.RDSTATION_CLIENT_ID;
const RDSTATION_CLIENT_SECRET = process.env.RDSTATION_CLIENT_SECRET;

module.exports.handler = (event, context, callback) => {

    const { code, state } = event.queryStringParameters;

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
        'client_id': RDSTATION_CLIENT_ID,
        'client_secret': RDSTATION_CLIENT_SECRET,
    };

    const headers = {
        'Content-Type': 'application/json'
    };

    Axios({
        method: 'post',
        url: RDSTATION_AUTH_URL,
        headers,
        data
    }).then(credentials_result => {

            if (credentials_result.message || credentials_result.errorMessage)
                return callback(null, callback_payload);
            else if (credentials_result.data) {
                
                const credentials = credentials_result.data;

                Axios({
                    method: 'get',
                    url: 'https://api.rd.services/marketing/account_info', 
                    headers: { 
                        'Authorization': `Bearer ${credentials.access_token}` 
                    } 
                }).then(user_result => {

                    if (user_result.message || user_result.errorMessage)
                        return callback(null, callback_payload);
                    else {

                        const { name } = user_result.data;
                        const connection_id = name;

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
};