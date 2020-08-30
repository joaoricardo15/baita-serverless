const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const { URLSearchParams } = require('url');
const Axios = require('axios');

const BOTS_TABLE = process.env.BOTS_TABLE;
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;
const SERVICE_PROD_URL = process.env.SERVICE_PROD_URL;
const GOOGLE_AUTH_URL = process.env.GOOGLE_AUTH_URL;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

module.exports.handler = (event, context, callback) => {

    const { code, state, error } = event.queryStringParameters;

    const callback_payload = {
        statusCode: 200,
        headers: { 'Content-type': 'text/html' },
        body: '<script>window.close()</script>'
    }

    if (error)
        return callback(null, callback_payload);

    const app_id = state.split(':')[0];
    const user_id = state.split(':')[1];
    const bot_id = state.split(':')[2];
    const task_index = state.split(':')[3];

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    const data = new URLSearchParams({
        code,
        'grant_type': 'authorization_code',
        'redirect_uri': `${SERVICE_PROD_URL}/connectors/google`,
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
    });

    Axios({
        method: 'post',
        url: GOOGLE_AUTH_URL,
        headers,
        data
    }).then(credentials_result => {

            if (credentials_result.message || credentials_result.errorMessage)
                return callback(null, callback_payload);
            else if (credentials_result.data) {
                
                const credentials = credentials_result.data;

                Axios({
                    method: 'get',
                    url:`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${credentials.access_token}`
                }).then(user_result => {

                    if (user_result.message || user_result.errorMessage)
                        callback(null, callback_payload);
                    else {

                        const { id, email } = user_result.data;
                        const connection_id = id;

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

                                const params = {
                                    TableName: CONNECTIONS_TABLE,
                                    Item: {
                                        name: email,
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
                                    }).catch(error => callback(error));
                            }).catch(error => callback(error));
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