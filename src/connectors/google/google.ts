"use strict";

import Axios from "axios";
import qs from "qs";

const SERVICE_PROD_URL = process.env.SERVICE_PROD_URL || "";
const GOOGLE_AUTH_URL = process.env.GOOGLE_AUTH_URL || "";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

export class Google {
  async getCredentials(code: string): Promise<{ access_token:string, any}> {
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    const data = qs.stringify({
      code: code,
      grant_type: "authorization_code",
      redirect_uri: `${SERVICE_PROD_URL}/connectors/google`,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      access_type: "offline",
    });

    const credentialsResult = await Axios({
      method: "post",
      url: GOOGLE_AUTH_URL,
      headers,
      data,
    });

    if (credentialsResult.status !== 200) throw credentialsResult.data;

    return credentialsResult.data;
  }

  async getConnectionInfo(
    access_token: string
  ): Promise<{ connection_id: string; email: string }> {
    const tokenResult = await Axios({
      method: "get",
      url: `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${access_token}`,
    });

    if (tokenResult.status !== 200) throw tokenResult.data;

    const { id, email } = tokenResult.data;

    return { connection_id: id.toString(), email };
  }

  desconstructAuthState(state: string): {
    app_id: string;
    user_id: string;
    bot_id: string;
    task_index: number;
  } {
    const splitedState = state.split(":");

    return {
      app_id: splitedState[0],
      user_id: splitedState[1],
      bot_id: splitedState[2],
      task_index: parseInt(splitedState[3]),
    };
  }
}
