"use strict";

import Ajv, { JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

export interface ILog {
  bot_id: string;
  user_id: string;
}

export const logSchema: JSONSchemaType<ILog> = {
  type: "object",
  properties: {
    bot_id: {
      type: "string",
    },
    user_id: {
      type: "string",
    }
  },
  required: ["bot_id", "user_id"],
};

export function validateLog(connection: ILog): void {
  const validate = ajv.compile(logSchema);

  if (!validate(connection)) throw ajv.errorsText(validate.errors);
}
