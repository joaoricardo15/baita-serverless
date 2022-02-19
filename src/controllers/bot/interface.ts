"use strict";

import Ajv, { JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();
addFormats(ajv);

export interface IBot {
  bot_id: string;
  user_id: string;
}

export const botSchema: JSONSchemaType<IBot> = {
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

export function validateConnection(connection: IBot): void {
  const validate = ajv.compile(botSchema);

  if (!validate(connection)) throw ajv.errorsText(validate.errors);
}
