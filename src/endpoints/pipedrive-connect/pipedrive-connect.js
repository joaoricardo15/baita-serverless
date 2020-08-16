const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const { URLSearchParams } = require('url');
const Axios = require('axios');

const SERVERLESS_DEV_URL = process.env.SERVERLESS_DEV_URL;
const PIPEDRIVE_AUTH_URL = process.env.PIPEDRIVE_AUTH_URL;
const PIPEDRIVE_CLIENT_ID = process.env.PIPEDRIVE_CLIENT_ID;
const PIPEDRIVE_CLIENT_SECRET = process.env.PIPEDRIVE_CLIENT_SECRET;

module.exports.handler = (event, context, callback) => {

    const { code, state } = event.queryStringParameters;
    const app_id = state.split(':')[0];
    const user_id = state.split(':')[1];
    const bot_id = state.split(':')[2];
    const task_index = state.split(':')[3];

    const body = new URLSearchParams({
        code,
        'grant_type': 'authorization_code',
        'redirect_uri': `${SERVERLESS_DEV_URL}/pipedrive/connect`
    });

    const auth = {
        username: PIPEDRIVE_CLIENT_ID,
        password: PIPEDRIVE_CLIENT_SECRET
    }

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    Axios({
        auth,
        headers,
        method: 'post',
        url: PIPEDRIVE_AUTH_URL,
        data: body
    }).then(credentials_result => {
            
            if (credentials_result.message)
                callback(credentials_result);
            else if (credentials_result.data) {
                
                const credentials = credentials_result.data;

                Axios({
                    method: 'get',
                    url:`${credentials.api_domain}/users/me`, 
                    headers: { 
                        'Authorization': `Bearer ${credentials.access_token}` 
                    } 
                }).then(user_result => {
                
                    if (user_result.message || !user_result.data || !user_result.data.success)
                        callback(user_result);
                    else {

                        const { id, name, email } = user_result.data.data;
                        const connection_id = id.toString();

                        const params = {
                            TableName:'connections',
                            Item: {
                                name,
                                email,
                                app_id,
                                user_id,
                                credentials,
                                connection_id
                            }
                        };

                        ddb.put(params).promise()
                            .then(() => {
                            
                                const sample_params = {
                                    TableName:"bots",
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
                                        callback(null, {
                                            statusCode: 200,
                                            headers: {
                                                'Content-type': 'text/html'
                                            },
                                            body: '<script>window.close()</script>'
                                        });
                                    }).catch(error => callback(error));
                            }).catch(error => callback(error));
                    }
                }).catch(error => callback(error));
            }
        }).catch(error => callback(error));
};