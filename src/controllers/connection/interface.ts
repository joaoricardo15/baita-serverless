"use strict";

import Ajv, { JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

export interface IConnection {
  user_id: string;
  connection_id: string;
  app_id: string;
  credentials: object;
  name: string;
  email: string;
  user_name: string;
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
    },
    name: {
      type: "string",
    },
    email: {
      type: "string",
      format: "email",
    },
    user_name: {
      type: "string",
    },
  },
  required: ["user_id", "connection_id", "app_id", "credentials", "name", "email", "user_name"],
};

export function validateConnection(connection: IConnection): void {
  const validate = ajv.compile(connectionSchema);

  if (!validate(connection)) throw ajv.errorsText(validate.errors);
}
