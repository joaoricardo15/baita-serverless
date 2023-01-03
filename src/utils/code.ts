'use strict'

import JSZip from 'jszip'
import { ConditionType, ITask, ITaskCondition } from 'src/models/bot'
import { IVariable } from 'src/models/service'

const zip = new JSZip()

const SERVICE_PREFIX = process.env.SERVICE_PREFIX || ''

const comparationExpressions = {
  equals: '==',
  diferent: '!=',
  exists: '',
  donotexists: '',
}

const getInputString = (
  inputData: IVariable[],
  serviceFields?: IVariable[]
) => {
  let inputString = ''

  if (serviceFields)
    for (let j = 0; j < serviceFields.length; j++) {
      const fieldName = serviceFields[j].name
      const inputField = inputData.find((x) => x.name === fieldName)
      if (!inputField) throw `Input field ${fieldName} not found.`
      if (
        inputField.outputIndex !== undefined &&
        inputField.outputPath !== undefined
      ) {
        inputString += `'${inputField.name}': task${
          inputField.outputIndex
        }_outputData${inputField.outputPath
          .split('.')
          .reduce(
            (prev, curr) =>
              `${prev}${
                !curr
                  ? ''
                  : !isNaN(parseInt(curr))
                  ? `[${curr}]`
                  : `['${curr}']`
              }`,
            ''
          )},`
      } else if (inputField.value) {
        inputString += `'${inputField.name}': \`${inputField.value}\`,`
      }
    }

  return inputString
}

const getConditionsString = (conditions?: ITaskCondition[]) => {
  let andConditionsString = ''

  if (conditions)
    for (let j = 0; j < conditions.length; j++) {
      const andConditions = conditions[j].andConditions

      if (andConditions) {
        for (let k = 0; k < andConditions.length; k++) {
          const andCondition = andConditions[k]

          let conditionValue = ''
          if (andCondition.outputIndex !== undefined) {
            conditionValue = `task${andCondition.outputIndex}_outputData['${andCondition.name}']`
          } else if (andCondition.value) {
            conditionValue = `\`${andCondition.value}\``
          }

          const conditionExpression = comparationExpressions[andCondition.type]

          const comparationValue = andCondition.type

          if (conditionValue && andCondition.type)
            andConditionsString += `${k === 0 ? '' : ' && '}${
              andCondition.type === ConditionType.donotexists
                ? `!${conditionValue}`
                : andCondition.type === ConditionType.exists
                ? `${conditionValue}`
                : `${conditionValue} ${conditionExpression} ${comparationValue}`
            }`
        }
      }

      if (andConditionsString) {
        andConditionsString += `${
          j === 0 ? '' : ' || '
        }(${andConditionsString})`
      }
    }

  return andConditionsString
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

    const task${i}_outputData = {};

    ////////////////////////////////////////////////////////////////////////////////
    // 4.2. Check conditions

    if (${conditionsString || true}) {
      ////////////////////////////////////////////////////////////////////////////////
      // 4.2.1 If condition passes, execute operation

      const task${i}_response = await lambda.invoke({
        FunctionName: '${SERVICE_PREFIX}-${service?.name}',
        Payload: JSON.stringify({ userId, appConfig: task${i}_appConfig, serviceConfig: task${i}_serviceConfig, connectionId: task${i}_connectionId, inputData: task${i}_inputData, outputPath: task${i}_outputPath }),
      }).promise();
  

      ////////////////////////////////////////////////////////////////////////////////
      // 4.2.2 Parse results
      
      const task${i}_success = task${i}_result.success;

      const task${i}_result = JSON.parse(task${i}_response.Payload);
      
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

  let outputData;
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
        outputData = JSON.parse(event.body);
      }
    } catch (error) {
      outputData = event.body;
    }
  } else {
    outputData = event;
  }

  
  ////////////////////////////////////////////////////////////////////////////////
  // 3. Publish trigger sample

  await lambda.invoke({
    FunctionName: '${SERVICE_PREFIX}-trigger-sample',
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

  let task0_outputData;
  if (event.body) {
    try {
      if (event.isBase64Encoded &&
          event.headers['Content-type'] &&
          event.headers['Content-type'] === 'application/x-www-form-urlencoded'
        ) {
        const buffer = new Buffer(event.body, 'base64');
        const bodyString = buffer.toString('ascii').replace(/&/g, ",").replace(/=/g, ":");
        const jsonBody = JSON.parse('{"' + decodeURI(bodyString) + '"}');
        task0_outputData = jsonBody;
      }
      else {
        task0_outputData = JSON.parse(event.body);
      }
    } catch (error) {
      task0_outputData = event.body;
    }
  } else {
    task0_outputData = event;
  }

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
    errorData = error;
  }


  ////////////////////////////////////////////////////////////////////////////////
  // 5. Publish bot logs

  console.log({
    logs,
    usage,
    botId,
    userId,
    error: errorData,
    timestamp: Date.now(),
  });


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
