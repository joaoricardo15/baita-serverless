'use strict'

import JSZip from 'jszip'
import {
  ITask,
  ITaskCondition,
  ConditionOperator,
} from 'src/models/bot/interface'
import { DataType, VariableType } from 'src/models/service/interface'
import { getDataFromService, OUTPUT_CODE } from './bot'

const zip = new JSZip()

const SERVICE_PREFIX = process.env.SERVICE_PREFIX || ''

const getStringifiedVariableValue = (value: DataType) => {
  switch (typeof value) {
    case 'undefined':
      return '``'
    case 'object':
      return `{ ${value} }`
    case 'number':
      return `${value}`
    case 'boolean':
      return `${value}`
    case 'string':
      return value.startsWith(OUTPUT_CODE)
        ? value.replace(OUTPUT_CODE, '')
        : `\`${value}\``
  }
}

export const getInputString = (input: object) => {
  return Object.keys(input)
    .map((x) => `'${x}': ${getStringifiedVariableValue(input[x])}`)
    .join(',')
}

const decodeCondition = (condition: ITaskCondition): string => {
  const {
    operator,
    operand,
    comparisonOperand = { name: '', label: '', type: VariableType.constant },
  } = condition

  const stringOperand = getStringifiedVariableValue(operand.value || '')
  const stringComparison = getStringifiedVariableValue(
    comparisonOperand.value || ''
  )

  switch (operator) {
    case ConditionOperator.equals:
      return `${stringOperand} == ${stringComparison}`
    case ConditionOperator.notEquals:
      return `${stringOperand} != ${stringComparison}`
    case ConditionOperator.contains:
      return `${stringOperand}.includes(${stringComparison})`
    case ConditionOperator.startsWith:
      return `${stringOperand}.startsWith(${stringComparison})`
    case ConditionOperator.endsWith:
      return `${stringOperand}.endsWith(${stringComparison})`
    case ConditionOperator.exists:
      return `!!${stringOperand}`
    case ConditionOperator.doNotExists:
      return `!${stringOperand}`
  }
}

export const getConditionsString = (conditions?: ITaskCondition[][]) => {
  return conditions
    ?.map((orConditions) =>
      orConditions
        .map((andCondition) => decodeCondition(andCondition))
        .join(' && ')
    )
    .map((x) => `(${x})`)
    .join(' || ')
}

const getParseEventFunctionCode = () => {
  return `(() => {
    if (event.body) {
      try {
        if (event.isBase64Encoded &&
            event.headers['Content-type'] &&
            event.headers['Content-type'] === 'application/x-www-form-urlencoded'
          ) {
          const buffer = new Buffer(event.body, 'base64');
          const bodyString = buffer.toString('ascii').replace(/&/g, ",").replace(/=/g, ":");
          const jsonBody = JSON.parse('{"' + decodeURI(bodyString) + '"}');
          return jsonBody;
        }
        else {
          return JSON.parse(event.body);
        }
      } catch (error) {
        return event.body;
      }
    } else {
      return event;
    }
  })()`
}

export const getBotSampleCode = (userId: string, botId: string) => {
  return `
const { Lambda } = require('@aws-sdk/client-lambda');
const lambda = new Lambda();

module.exports.handler = async (event, context, callback) => {
  ////////////////////////////////////////////////////////////////////////////////
  // 1. Declare global variables

  const botId = '${botId}';
  const userId = '${userId}';

  ////////////////////////////////////////////////////////////////////////////////
  // 2. Get data from event and save it as outputData

  const outputData = ${getParseEventFunctionCode()};
  
  ////////////////////////////////////////////////////////////////////////////////
  // 3. Publish trigger sample

  await lambda.invoke({
    FunctionName: '${SERVICE_PREFIX}-service-trigger-sample',
    Payload: JSON.stringify({ userId, botId, outputData, status: 'success' })
  });

  ////////////////////////////////////////////////////////////////////////////////
  // 4. Return success

  callback(null, {
    statusCode: 200,
    headers: {
      'Content-type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: true
    })
  }); 
};
    `
}

export const getCompleteBotCode = (
  userId: string,
  botId: string,
  tasks: ITask[]
) => {
  return `
const { Lambda } = require('@aws-sdk/client-lambda');
const lambda = new Lambda();

module.exports.handler = async (event, context, callback) => {
  ////////////////////////////////////////////////////////////////////////////////
  // 1. Declare global variables

  const botId = '${botId}';
  const userId = '${userId}';
  let logs = [], usage = 0, errorData, outputData;
  
  ////////////////////////////////////////////////////////////////////////////////
  // 2. Get input bot from event, and save it as task0_outputData

  const task0_outputData = ${getParseEventFunctionCode()};

  ////////////////////////////////////////////////////////////////////////////////
  // 3. Register fist log and increment usage

  usage += 1;
  logs.push({
    name: '${tasks[0].service?.label}',
    outputData: task0_outputData,
    timestamp: Date.now(),
    status: 'success'
  });
  
  ////////////////////////////////////////////////////////////////////////////////
  // 4. Execute tasks

  try {
    ${getBotInnerCode(tasks)}
  } catch (error) {
    errorData = error.toString()
  }

  ////////////////////////////////////////////////////////////////////////////////
  // 5. Publish bot logs

  console.log(JSON.stringify({
    logs,
    usage,
    botId,
    userId,
    error: errorData,
    timestamp: Date.now()
  }));

  ////////////////////////////////////////////////////////////////////////////////
  // 6. Return success

  callback(null, {
    statusCode: 200,
    headers: {
      'Content-type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: !errorData,
      data: errorData || outputData
    })
  });
};`
}

const getBotInnerCode = (tasks: ITask[]) => {
  let innerCode = ''

  for (let i = 1; i < tasks.length; i++) {
    const task = tasks[i]
    const app = task.app
    const service = task.service
    const conditions = task.conditions

    const inputData = getDataFromService(
      service?.config.inputFields || [],
      task.inputData
    )

    const inputDataString = getInputString(inputData)

    const conditionsString = getConditionsString(conditions)

    innerCode += `
    ////////////////////////////////////////////////////////////////////////////////
    // 4.1. Collect operation inputs

    const task${i}_inputData = { ${inputDataString} };
    
    const task${i}_appConfig = ${JSON.stringify(app?.config)};

    const task${i}_serviceConfig = ${JSON.stringify(service?.config)};
    
    const task${i}_connectionId = ${task.connectionId || 'undefined'};

    const task${i}_outputPath = ${service?.config.outputPath || '``'};

    let task${i}_outputData = {};

    ////////////////////////////////////////////////////////////////////////////////
    // 4.2. Check conditions

    if (${conditionsString || true}) {
      ////////////////////////////////////////////////////////////////////////////////
      // 4.2.1 If condition passes, execute operation

      const { Payload: task${i}_lambda_payload } = await lambda.invoke({
        FunctionName: '${SERVICE_PREFIX}-task-${service?.name}',
        Payload: JSON.stringify({ userId, appConfig: task${i}_appConfig, serviceConfig: task${i}_serviceConfig, connectionId: task${i}_connectionId, inputData: task${i}_inputData, outputPath: task${i}_outputPath }),
      });

      ////////////////////////////////////////////////////////////////////////////////
      // 4.2.2 Parse results

      const task${i}_result = JSON.parse(Buffer.from(task${i}_lambda_payload).toString());
      
      const task${i}_success = task${i}_result.success;

      task${i}_outputData = task${i}_success && task${i}_result.data ? task${i}_result.data : { message: task${i}_result.message || task${i}_result.errorMessage || 'nothing for you this time : (' };

      ////////////////////////////////////////////////////////////////////////////////
      // 4.2.3 Add result to logs

      logs.push({
        timestamp: Date.now(),
        name: '${service?.label}',
        inputData: task${i}_inputData,
        outputData: task${i}_outputData,
        status: task${i}_success ? 'success' : 'fail',
      });

      ////////////////////////////////////////////////////////////////////////////////
      // 4.2.4 If task executed successfully, increment usage

      if (task${i}_success) usage += 1;
  ${
    task.returnData
      ? `
      ////////////////////////////////////////////////////////////////////////////////
      // 4.2.5 If task property returnData equals true, set outputData to task result
        
      if (task${i}_success) outputData = task${i}_outputData;
      `
      : ''
  }
    } else {
      ////////////////////////////////////////////////////////////////////////////////
      // 4.2.1 If condition does not pass, add result to logs

      logs.push({
        timestamp: Date.now(),
        name: '${service?.label}',
        inputData: task${i}_inputData,
        outputData: task${i}_outputData,
        status: 'filtered',
      });
    }`
  }

  return innerCode
}

export const getCodeFile = async (code: string) => {
  zip.file('index.js', code)

  const archive = await zip.generateAsync({ type: 'base64' })

  return Buffer.from(archive, 'base64')
}
