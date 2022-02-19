"use strict";

import { Api } from "src/utils/api";
import { User } from "src/controllers/user";
import { IUser } from "src/controllers/user/interface";

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context);
  const user = new User();

  try {
    const body = JSON.parse(event.body);

    // Necessary to extract only the native properties from user
    const { user_id, name, email, given_name, family_name, picture, phone } =
      body;
    const formatedUser: IUser = {
      user_id,
      name,
      email,
      given_name,
      family_name,
      picture,
      phone,
    };

    const data = await user.create(formatedUser);

    api.httpResponse(callback, "success", undefined, data);
  } catch (err) {
    api.httpResponse(callback, "fail", err);
  }
};
