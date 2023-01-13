'use strict'

import { DataType } from 'src/models/bot/interface'

export enum BotStatus {
  fail = 'fail',
  timeout = 'timeout',
  filtered = 'filtered',
  success = 'success',
}

export class Api {
  functionName: string
  timeoutLogger: ReturnType<typeof setTimeout>
  logObject: {
    inputData: any
    status?: BotStatus
    message?: string
    data?: DataType
  }

  constructor(inputData, functionContext) {
    this.logObject = { inputData }

    // 200 ms before a lambda times out, logs everything so far with status = 'timeout'
    this.timeoutLogger = setTimeout(() => {
      this.log(BotStatus.timeout)
    }, functionContext.getRemainingTimeInMillis() - 200)
  }

  parseError(err: any): string {
    let errorMessage

    if (err) {
      if (typeof err === 'string' || typeof err === 'number') {
        errorMessage = err
      } else if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object') {
        errorMessage = JSON.stringify(err)
      } else {
        errorMessage = 'Unknow error'
      }
    }

    return errorMessage
  }

  log(status: BotStatus, error?: string, data?: any): void {
    // prevents timeout logging if another log has already started
    clearTimeout(this.timeoutLogger)

    this.logObject['status'] = status
    this.logObject['message'] = error
    this.logObject['data'] = data
    console.log(JSON.stringify(this.logObject))
  }

  httpResponse(
    callback: any,
    status: BotStatus,
    error?: string,
    data?: any
  ): void {
    const errorMessage = this.parseError(error)

    this.log(status, errorMessage, data)

    callback(null, {
      statusCode: 200,
      headers: {
        'Content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: status === BotStatus.success,
        message: errorMessage,
        data,
      }),
    })
  }

  httpConnectorResponse(callback: any, status: BotStatus, error?: any): void {
    const errorMessage = this.parseError(error)

    this.log(status, errorMessage)

    callback(null, {
      statusCode: 200,
      headers: { 'Content-type': 'text/html' },
      body: '<script>window.close()</script>',
    })
  }

  httpOperationResponse(
    callback: any,
    status: BotStatus,
    error?: any,
    data?: any
  ): void {
    const errorMessage = this.parseError(error)

    this.log(status, errorMessage, data)

    callback(null, {
      success: status === BotStatus.success,
      message: errorMessage,
      data,
    })
  }
}
