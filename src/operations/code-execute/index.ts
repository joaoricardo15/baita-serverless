"use strict";

import vm from "vm";

exports.handler = (event, context, callback) => {
  const { input_data: inputData } = event;

  const code = `${inputData.code}`;

  const codeInput: any = {};

  for (const varName in inputData)
    if (varName !== "code") codeInput[varName] = inputData[varName];

  const script = new vm.Script(code);

  vm.createContext(codeInput);

  try {
    script.runInContext(codeInput, { displayErrors: true, timeout: 5000 });

    callback(null, {
      success: true,
      data: codeInput.output,
    });
  } catch (error) {
    callback(null, {
      success: false,
      ...error,
    });
  }
};
