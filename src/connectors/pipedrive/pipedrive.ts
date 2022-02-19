"use strict";

import Axios from "axios";

const SERVICE_PROD_URL = process.env.SERVICE_PROD_URL || "";
const PIPEDRIVE_AUTH_URL = process.env.PIPEDRIVE_AUTH_URL || "";
const PIPEDRIVE_CLIENT_ID = process.env.PIPEDRIVE_CLIENT_ID || "";
const PIPEDRIVE_CLIENT_SECRET = process.env.PIPEDRIVE_CLIENT_SECRET || "";

export class Pipedrive {
  async getCredentials(code: string): Promise<{ api_domain:string, access_token:string }> {

    const auth = {
      username: PIPEDRIVE_CLIENT_ID,
      password: PIPEDRIVE_CLIENT_SECRET,
    };

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const data = new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: `${SERVICE_PROD_URL}/connectors/pipedrive`,
    });

    const credentialsResult = await Axios({
      auth,
      method: "post",
      url: PIPEDRIVE_AUTH_URL,
      headers,
      data
    });

    if (credentialsResult.status !== 200)
      throw credentialsResult.data;
    
    const { api_domain, access_token } = credentialsResult.data;
  
    return { api_domain, access_token }
  }

  async getConnectionInfo(api_domain: string, access_token: string): Promise<{ connection_id:string, name:string, email:string }> {

    const tokenResult = await Axios({
      method: "get",
      url: `${api_domain}/users/me`,
      headers: {
        Authorization: `Bearer ${access_token}`,
      }
    })

    if (tokenResult.status !== 200)
      throw tokenResult.data;
    
    const { id, name, email } = tokenResult.data.data;

    return { connection_id: id.toString(), name, email }
  }

  desconstructAuthState(state: string): { app_id:string, user_id:string, bot_id:string, task_index:number } {

    const splitedState = state.split(":")

    return {
      app_id: splitedState[0],
      user_id: splitedState[1],
      bot_id: splitedState[2],
      task_index: parseInt(splitedState[3])
    }
  }
}
