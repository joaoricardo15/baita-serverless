"use strict";

export class Api {

  functionName: string;
  timeoutLogger: ReturnType<typeof setTimeout>;
  logObject: {
    inputData: any;
    status?: string;
    message?: string;
    data?: any;
  };

  constructor(inputData, functionContext) {
    this.logObject = { inputData };

    // 200 ms before a lambda times out, logs everything so far with status = 'timeout'
    this.timeoutLogger = setTimeout(() => {
      this.log("timeout");
    }, functionContext.getRemainingTimeInMillis() - 200);
  }

  log(status: string, message?: string, data?: any): void {
    // prevents timeout logging if another log has already started
    clearTimeout(this.timeoutLogger);

    this.logObject["status"] = status;
    this.logObject["message"] = message;
    this.logObject["data"] = data;
    console.log(JSON.stringify(this.logObject));
  }

  httpResponse(
    callback: any,
    status: string,
    message?: string,
    data?: any
  ): void {
    this.log(status, message, data);

    callback(null, {
      statusCode: 200,
      headers: {
        "Content-type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: status === "success",
        message,
        data,
      }),
    });
  }

  httpConnectorResponse(callback: any, status: string): void {
    this.log(status);

    callback(null, {
      statusCode: 200,
      headers: { "Content-type": "text/html" },
      body: "<script>window.close()</script>",
    });
  }

  httpOperationResponse(callback: any, status: string, data?: any): void {
    this.log(status, undefined, data);

    callback(null, {
      success: status === "success",
      data,
    });
  }
}
