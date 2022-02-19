"use strict";

import Ajv, { JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

export interface IUser {
  user_id: string;
  name: string;
  email: string;
  given_name: string;
  family_name: string;
  picture: string;
  phone: string;
}

export const userSchema: JSONSchemaType<IUser> = {
  type: "object",
  properties: {
    user_id: {
      type: "string",
    },
    name: {
      type: "string",
    },
    email: {
      type: "string",
      format: "email",
    },
    given_name: {
      type: "string",
    },
    family_name: {
      type: "string",
    },
    picture: {
      type: "string",
    },
    phone: {
      type: "string",
    },
  },
  required: ["user_id", "name", "email"],
};

export function validateUser(user: IUser): void {
  const validate = ajv.compile(userSchema);

  if (!validate(user)) throw ajv.errorsText(validate.errors);
}
