"use strict";

import Ajv, { JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

export interface ITaskLog {
  name: string;
  status: string;
  timestamp: number;
  output_data?: any;
}

export interface ILog {
  bot_id: string;
  user_id: string;
  error?: any;
  timestamp: number;
  usage: number;
  logs: Array<ITaskLog>;
}

export const logSchema: JSONSchemaType<ILog> = {
  type: "object",
  properties: {
    bot_id: {
      type: "string",
    },
    user_id: {
      type: "string",
    },
    error: {
      type: "null",
      nullable: true
    },
    timestamp: {
      type: "number",
    },
    usage: {
      type: "number",
    },
    logs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          status: {
            type: "string",
          },
          timestamp: {
            type: "number",
          },
          output_data: {
            type: "null",
            nullable: true
          },
        },
        required: ["name", "status", "timestamp"],
      }
    },
  },
  required: ["bot_id", "user_id", "timestamp", "usage", "logs"],
};

export function validateLog(connection: ILog): void {
  const validate = ajv.compile(logSchema);

  if (!validate(connection)) throw ajv.errorsText(validate.errors);
}
