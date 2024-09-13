'use strict'

import JSZip from 'jszip'
import { ConditionOperator, ITask, ITaskCondition } from 'src/models/bot'
import { IVariable, VariableType } from 'src/models/service'

const zip = new JSZip()

const SERVICE_PREFIX = process.env.SERVICE_PREFIX || ''

const getOutputVariableString = (index: number = 0, path: string = '') =>
  `task${index}_outputData${path
    .split('.')
    .map((x) => x && (!isNaN(Number(x)) ? `[${x}]` : `[\`${x}\`]`))
    .join('')}`

const getStringifiedVariable = (variable: IVariable) => {
  const { type, value, outputPath, outputIndex } = variable

  if (type === VariableType.output)
    return getOutputVariableString(outputIndex, outputPath)

  switch (typeof value) {
    case 'number':
    case 'boolean':
      return `${value}`
    case 'string':
      return `\`${value}\``
    case 'object':
      return `{ ${value} }`
    case 'undefined':
      return '``'
  }
}

export const getInputString = (
  inputData: IVariable[],
  serviceFields?: IVariable[]
) => {
  if (!serviceFields) return ''

  return serviceFields
    .map((serviceField) => {
      const inputField = inputData.find((x) => x.name === serviceField.name)
      if (!inputField) throw `Input field ${serviceField.name} not found.`

      return `'${serviceField.name}': ${getStringifiedVariable(inputField)},`
    })
    .join('')
}

const decodeCondition = (condition: ITaskCondition): string => {
  const {
    operator,
    operand,
    comparisonOperand = { name: '', label: '', type: VariableType.constant },
  } = condition

  const stringOperand = getStringifiedVariable(operand)
  const stringComparison = getStringifiedVariable(comparisonOperand)

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

export const getBotSampleCode = (userId: string, botId: string) => {
  return `
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

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
  }).promise();


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
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

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
    body: JSON.stringify(errorData || outputData)
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

    const inputDataString = getInputString(
      task.inputData,
      service?.config.inputFields
    )

    const conditionsString = getConditionsString(conditions)

    innerCode += `
    ////////////////////////////////////////////////////////////////////////////////
    // 4.1. Collect operation inputs

    const task${i}_inputData = { ${inputDataString} };
    
    const task${i}_appConfig = ${JSON.stringify(app?.config)};

    const task${i}_serviceConfig = ${JSON.stringify(service?.config)};
    
    const task${i}_connectionId = '${task.connectionId}';

    const task${i}_outputPath = '${service?.config.outputPath || ''}';

    let task${i}_outputData = {};

    ////////////////////////////////////////////////////////////////////////////////
    // 4.2. Check conditions

    if (${conditionsString || true}) {
      ////////////////////////////////////////////////////////////////////////////////
      // 4.2.1 If condition passes, execute operation

      const { Payload: task${i}_lambda_payload } = await lambda.invoke({
        FunctionName: '${SERVICE_PREFIX}-task-${service?.name}',
        Payload: JSON.stringify({ userId, appConfig: task${i}_appConfig, serviceConfig: task${i}_serviceConfig, connectionId: task${i}_connectionId, inputData: task${i}_inputData, outputPath: task${i}_outputPath }),
      }).promise();
  

      ////////////////////////////////////////////////////////////////////////////////
      // 4.2.2 Parse results

      const task${i}_result = JSON.parse(task${i}_lambda_payload);
      
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
