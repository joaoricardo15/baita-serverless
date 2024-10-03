import { TaskExecutionStatus } from 'src/models/bot/interface'
import { DataType } from 'src/models/service/interface'

export enum ApiRequestStatus {
  fail = 'fail',
  timeout = 'timeout',
  filtered = 'filtered',
  success = 'success',
}

class Api {
  functionName: string
  timeoutLogger: ReturnType<typeof setTimeout>
  logObject: {
    inputData: DataType
    status?: ApiRequestStatus | TaskExecutionStatus
    message?: string
    data?: DataType
  }

  constructor(inputData, functionContext) {
    this.logObject = { inputData }

    // 200 ms before a lambda times out, logs everything so far with status = 'timeout'
    this.timeoutLogger = setTimeout(() => {
      this.log(ApiRequestStatus.timeout)
    }, functionContext.getRemainingTimeInMillis() - 200)
  }

  parseError(err): string {
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

  log(
    status: ApiRequestStatus | TaskExecutionStatus,
    error?: string,
    data?
  ): void {
    // prevents timeout logging if another log has already started
    clearTimeout(this.timeoutLogger)

    this.logObject.status = status
    this.logObject.message = error
    this.logObject.data = data
    console.log(JSON.stringify(this.logObject))
  }

  httpResponse(
    callback,
    status: ApiRequestStatus,
    error?: string,
    data?
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
        success: status === ApiRequestStatus.success,
        message: errorMessage,
        data,
      }),
    })
  }

  httpConnectorResponse(callback, status: ApiRequestStatus, error?): void {
    const errorMessage = this.parseError(error)

    this.log(status, errorMessage)

    callback(null, {
      statusCode: 200,
      headers: { 'Content-type': 'text/html' },
      body: '<script>window.close()</script>',
    })
  }

  taskExecutionResponse(
    callback,
    status: TaskExecutionStatus,
    error?,
    data?
  ): void {
    const errorMessage = this.parseError(error)

    this.log(status, errorMessage, data)

    callback(null, {
      success: status === TaskExecutionStatus.success,
      message: errorMessage,
      data,
    })
  }
}

export default Api
