const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const { URLSearchParams } = require('url');
const Axios = require('axios');

const BOTS_TABLE = process.env.BOTS_TABLE;
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;
const SERVICE_PROD_URL = process.env.SERVICE_PROD_URL;
const PIPEDRIVE_AUTH_URL = process.env.PIPEDRIVE_AUTH_URL;
const PIPEDRIVE_CLIENT_ID = process.env.PIPEDRIVE_CLIENT_ID;
const PIPEDRIVE_CLIENT_SECRET = process.env.PIPEDRIVE_CLIENT_SECRET;

module.exports.handler = (event, context, callback) => {

    const { code, state, error } = event.queryStringParameters;

    const callback_payload = {
        statusCode: 200,
        headers: {
            'Content-type': 'text/html'
        },
        body: '<script>window.close()</script>'
    }

    if (error)
        return callback(null, callback_payload);

    const app_id = state.split(':')[0];
    const user_id = state.split(':')[1];
    const bot_id = state.split(':')[2];
    const task_index = state.split(':')[3];

    const auth = {
        username: PIPEDRIVE_CLIENT_ID,
        password: PIPEDRIVE_CLIENT_SECRET
    }

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    const data = new URLSearchParams({
        code,
        'grant_type': 'authorization_code',
        'redirect_uri': `${SERVICE_PROD_URL}/pipedrive/connect`
    });

    Axios({
        auth,
        method: 'post',
        url: PIPEDRIVE_AUTH_URL,
        headers,
        data: data
    }).then(credentials_result => {

            if (credentials_result.message || credentials_result.errorMessage)
                return callback(null, callback_payload);
            else if (credentials_result.message || credentials_result.errorMessage) {
                
                const credentials = credentials_result.data;

                Axios({
                    method: 'get',
                    url:`${credentials.api_domain}/users/me`, 
                    headers: { 
                        'Authorization': `Bearer ${credentials.access_token}` 
                    } 
                }).then(user_result => {

                    if (user_result.message || user_result.errorMessage)
                        callback(null, callback_payload);
                    else {

                        const sample_params = {
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

                        ddb.update(sample_params).promise()
                            .then(() => {

                                const { id, name, email } = user_result.data.data;
                                const connection_id = id.toString();

                                const params = {
                                    TableName: CONNECTIONS_TABLE,
                                    Item: {
                                        name: email,
                                        user_name: name,
                                        email,
                                        app_id,
                                        user_id,
                                        credentials,
                                        connection_id
                                    }
                                };

                                ddb.put(params).promise()
                                    .then(() => {
                                        callback(null, callback_payload);
                                    }).catch(error => callback(null, callback_payload));
                            }).catch(error => callback(null, callback_payload));
                    }
                }).catch(error => callback(null, callback_payload));
            }
        }).catch(error => callback(null, callback_payload));
};