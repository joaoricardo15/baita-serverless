"use strict";

import Ajv, { JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

export interface ICredential {
  refresh_token?: string;
  access_token?: string;
}

export interface IConnection {
  user_id: string;
  connection_id: string;
  app_id: string;
  credentials: ICredential;
  name: string;
  email?: string;
  user_name?: string;
}

export const connectionSchema: JSONSchemaType<IConnection> = {
  type: "object",
  properties: {
    user_id: {
      type: "string",
    },
    connection_id: {
      type: "string",
    },
    app_id: {
      type: "string",
    },
    credentials: {
      type: "object",
      properties: {
        refresh_token: {
          type: "string",
          nullable: true,
        },
        access_token: {
          type: "string",
          nullable: true,
        },
      },
      required: [],
    },
    name: {
      type: "string",
    },
    email: {
      type: "string",
      format: "email",
      nullable: true,
    },
    user_name: {
      type: "string",
      nullable: true,
    },
  },
  required: ["user_id", "connection_id", "app_id", "credentials", "name"],
};

export function validateConnection(connection: IConnection): void {
  const validate = ajv.compile(connectionSchema);

  if (!validate(connection)) throw ajv.errorsText(validate.errors);
}
