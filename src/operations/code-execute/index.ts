"use strict";

import vm from "vm";
import { Api } from "src/utils/api";

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context);

  try {
    const { input_data } = event;

    const code = `${input_data.code}`;

    const codeInput: any = {};

    for (const varName in input_data)
      if (varName !== "code") codeInput[varName] = input_data[varName];

    const script = new vm.Script(code);

    vm.createContext(codeInput);

    script.runInContext(codeInput, { displayErrors: true, timeout: 5000 });

    const { output: data } = codeInput

    api.httpOperationResponse(callback, "success", undefined, data);
  } catch (err) {
    api.httpOperationResponse(callback, "fail", err);
  }
};
