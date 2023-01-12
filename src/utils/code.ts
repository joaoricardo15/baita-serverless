'use strict'

import JSZip from 'jszip'
import { ConditionOperator, ITask, ITaskCondition } from 'src/models/bot'
import { IVariable } from 'src/models/service'
import {
  getInputDataFromService,
  getVariableValue,
  OUTPUT_SEPARATOR,
} from './bot'

const zip = new JSZip()

const SERVICE_PREFIX = process.env.SERVICE_PREFIX || ''

const getInputString = (inputData: IVariable[], inputFields?: IVariable[]) => {
  return JSON.stringify(getInputDataFromService(inputData, inputFields))
    .replace(new RegExp(`"${OUTPUT_SEPARATOR}`, 'g'), '')
    .replace(new RegExp(`${OUTPUT_SEPARATOR}"`, 'g'), '')
}

const comparationExpressions: { [key in ConditionOperator]: string } = {
  [ConditionOperator.exists]: '',
  [ConditionOperator.doNotExists]: '',
  [ConditionOperator.equals]: '==',
  [ConditionOperator.notEquals]: '!=',
  [ConditionOperator.contains]: '.includes',
  [ConditionOperator.endsWith]: '.endsWith',
  [ConditionOperator.startsWith]: '.startsWith',
}

const getConditionsString = (conditions?: ITaskCondition[][]) => {
  let conditionsString = ''

  if (conditions)
    for (let j = 0; j < conditions.length; j++) {
      const orCondition = conditions[j]

      if (orCondition) {
        let andConditionString = ''

        for (let k = 0; k < orCondition.length; k++) {
          const andCondition = orCondition[k]

          if (!andCondition.conditionOperator) {
            throw Error(`Missing condition operator`)
          }

          const andConditionValue = (
            getVariableValue(andCondition) as string
          ).replace(new RegExp(OUTPUT_SEPARATOR, 'g'), '')

          if (andConditionValue && andCondition.conditionOperator)
            andConditionString += `${k === 0 ? '' : ' && '}${
              andCondition.conditionOperator === ConditionOperator.doNotExists
                ? `!${andConditionValue}`
                : andCondition.conditionOperator === ConditionOperator.exists
                ? `${andConditionValue}`
                : `${andConditionValue} ${
                    comparationExpressions[andCondition.conditionOperator]
                  } '${andCondition.conditionComparisonValue}'`
            }`
        }

        if (andConditionString) {
          conditionsString += `${j === 0 ? '' : ' || '}(${andConditionString})`
        }
      }
    }

  return conditionsString
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
          outputData = jsonBody;
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

const getBotInnerCode = (tasks: ITask[]) => {
  let innerCode = ''

  for (let i = 1; i < tasks.length; i++) {
    const { app, service, inputData, conditions, returnData, connectionId } =
      tasks[i]

    innerCode += `
    ////////////////////////////////////////////////////////////////////////////////
    // Task ${i}

    let task${i}_outputData = {};

    const task${i}_inputData = ${getInputString(
      inputData,
      service?.config.inputFields
    )};

    ////////////////////////////////////////////////////////////////////////////////
    // Task ${i} Filter conditions

    if (${getConditionsString(conditions) || true}) {
      ////////////////////////////////////////////////////////////////////////////////
      // If Task ${i} condition passes, 1. execute operation

      const { Payload: task${i}_lambda_payload } = await lambda.invoke({
        FunctionName: '${SERVICE_PREFIX}-task-${service?.name}',
        Payload: JSON.stringify({ 
          userId,
          connectionId: '${connectionId}',
          appConfig: ${JSON.stringify(app?.config)},
          serviceConfig: ${JSON.stringify(service?.config)},
          inputData: task${i}_inputData
        }),
      }).promise();
  

      ////////////////////////////////////////////////////////////////////////////////
      // Task ${i}.2 Parse results

      const task${i}_result = JSON.parse(task${i}_lambda_payload);
      
      const task${i}_success = task${i}_result.success;

      task${i}_outputData = task${i}_success && task${i}_result.data ? task${i}_result.data : { message: task${i}_result.message || task${i}_result.errorMessage || 'nothing for you this time : (' };
      

      ////////////////////////////////////////////////////////////////////////////////
      // Task ${i}.3 Add result to logs

      logs.push({
        timestamp: Date.now(),
        name: '${service?.label}',
        inputData: task${i}_inputData,
        outputData: task${i}_outputData,
        status: task${i}_success ? 'success' : 'fail',
      });


      ////////////////////////////////////////////////////////////////////////////////
      // Task ${i}.4 If task executed successfully, increment usage

      if (task${i}_success) usage += 1;

  ${
    returnData
      ? `
      ////////////////////////////////////////////////////////////////////////////////
      // Task ${i}.5 If task property returnData equals true, set outputData to task result
        
      if (task${i}_success) outputData = task${i}_outputData;
      `
      : ''
  }
    } else {
      ////////////////////////////////////////////////////////////////////////////////
      // If Task ${i} condition does not pass, 1. add result to logs

      logs.push({
        timestamp: Date.now(),
        name: '${service?.label}',
        inputData: task${i}_inputData,
        outputData: task${i}_outputData,
        status: 'filtered',
      });
    }
  
  `
  }

  return innerCode
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
    body: JSON.stringify({
      success: !errorData,
      data: errorData || outputData
    })
  });
};`
}

export const getCodeFile = async (code: string) => {
  zip.file('index.js', code)

  const archive = await zip.generateAsync({ type: 'base64' })

  return Buffer.from(archive, 'base64')
}
