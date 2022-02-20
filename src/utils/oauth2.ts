"use strict";

import { URLSearchParams } from "url";

export class Oauth2 {
  getDataFromParameters(type: string, headers, auth_fields, refresh_token) {
    let data;
    if (
      headers["Content-type"] &&
      headers["Content-type"] === "application/x-www-form-urlencoded"
    ) {
      const raw_data = {
        grant_type: "refresh_token",
        refresh_token: refresh_token,
      };

      if (type === "body") {
        raw_data["client_id"] = process.env[auth_fields.username];
        raw_data["client_secret"] = process.env[auth_fields.password];
      }

      data = new URLSearchParams(raw_data);
    } else {
      data = {
        grant_type: "refresh_token",
        refresh_token: refresh_token,
      };

      if (type === "body") {
        data["client_id"] = process.env[auth_fields.username];
        data["client_secret"] = process.env[auth_fields.password];
      }
    }

    return data;
  }

  getAuthFromParameters(type: string, auth_fields) {
    let auth;
    if (type === "basic")
      auth = {
        username: process.env[auth_fields.username],
        password: process.env[auth_fields.password],
      };
    
    return auth;
  }
}
