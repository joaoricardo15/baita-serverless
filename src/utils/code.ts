'use strict'

import JSZip from 'jszip'

const zip = new JSZip()

const SERVICE_PREFIX = process.env.SERVICE_PREFIX || ''

const comparationExpressions = {
  equals: '==',
  diferent: '!=',
  exists: '',
  donotexists: '',
}

export class Code {
  async getCodeFile(code) {
    zip.file('index.js', code)

    const archive = await zip.generateAsync({ type: 'base64' })

    return Buffer.from(archive, 'base64')
  }

  getSampleCode(userId: string, botId: string): string {
    return `
        const AWS = require('aws-sdk');
        const lambda = new AWS.Lambda({ region: "us-east-1" });
        
        const userId = '${userId}';
        const botId = '${botId}';
        
        module.exports.handler = async (event, context, callback) => {
        
            let task0_outputData;
            
            if (event.body)
                try {
                    task0_outputData = JSON.parse(event.body);
                } catch (error) {
                    task0_outputData = event.body;
                }
            
            await lambda.invoke({
                FunctionName: '${SERVICE_PREFIX}-sample-update',
                Payload: JSON.stringify({ userId, botId, taskIndex: 0, status: 'success', outputData: task0_outputData })
            }).promise();
        
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

  getBotCode(userId: string, botId: string, active: boolean, tasks) {
    if (
      !tasks ||
      !tasks.length ||
      tasks.length < 2 ||
      tasks[0].type !== 'trigger'
    )
      throw 'invalid bot config'

    let innerCode = ''

    for (let i = 1; i < tasks.length; i++) {
      const app = tasks[i].app
      const service = tasks[i].service

      let inputFields = ''
      if (service.config.inputSource === 'serviceFields')
        for (let j = 0; j < service.config.inputFields.length; j++) {
          const name = service.config.inputFields[j].name

          const inputField = tasks[i].inputData.find((x) => x.name === name)

          if (
            !service.name ||
            !service.config ||
            !tasks[i].inputData ||
            !inputField
          )
            throw 'invalid bot config'

          if (
            name &&
            ((!active && inputField.sampleValue) ||
              inputField.value ||
              (inputField.outputIndex !== undefined && inputField.outputName))
          )
            inputFields += `'${name}': ${
              !active
                ? `\`${inputField.sampleValue}\``
                : inputField.value
                ? `\`${inputField.value}\``
                : `task${inputField.outputIndex}_outputData['${inputField.outputName}']`
            },`
        }
      else if (service.config.inputSource === 'inputFields')
        for (let j = 0; j < tasks[i].inputData.length; j++) {
          const inputField = tasks[i].inputData[j]

          if (
            inputField.name &&
            ((!active && inputField.sampleValue) ||
              inputField.value ||
              (inputField.outputIndex !== undefined && inputField.outputName))
          )
            inputFields += `'${inputField.name}': ${
              !active
                ? `\`${inputField.sampleValue}\``
                : inputField.value
                ? `\`${inputField.value}\``
                : `task${inputField.outputIndex}_outputData['${inputField.outputName}']`
            },`
        }

      let conditions = ''
      if (tasks[i].conditions)
        for (let j = 0; j < tasks[i].conditions.length; j++) {
          let andConditions = ''

          for (
            let k = 0;
            k < tasks[i].conditions[j].andConditions.length;
            k++
          ) {
            const andCondition = tasks[i].conditions[j].andConditions[k]

            const conditionValue = !active
              ? `\`${andCondition.sampleValue}\``
              : andCondition.value
              ? `\`${andCondition.value}\``
              : `task${andCondition.outputIndex}_outputData['${andCondition.outputName}']`

            const conditionExpression =
              comparationExpressions[andCondition.type]

            const comparationValue = andCondition.type

            if (conditionValue && andCondition.type)
              andConditions += `${k === 0 ? '' : ' && '}${
                andCondition.type === 'donotexists'
                  ? `!${conditionValue}`
                  : andCondition.type === 'exists'
                  ? `${conditionValue}`
                  : `${conditionValue} ${conditionExpression} ${comparationValue}`
              }`
          }
          if (andConditions)
            conditions += `${j === 0 ? '' : ' || '}(${andConditions})`
        }

      innerCode += `
                const task${i}_name = '${tasks[i].service.name}';
        
                const task${i}_inputData = { ${inputFields} };
        
                let task${i}_outputData = {};
                
                let task${i}_outputLog = {
                    name: task${i}_name,
                    inputData: task${i}_inputData
                };
        
                if (${active ? true : `testTaskIndex === ${i}`} && ${
        conditions || true
      }) {
                
                    const task${i}_connection = ${JSON.stringify({
        userId,
        connectionId: tasks[i].connectionId,
        config: app.config,
      })};
            
                    const task${i}_config = ${JSON.stringify(service.config)};
                    
                    const task${i}_outputPath = ${
        service.config.outputPath
          ? `'${service.config.outputPath}'`
          : 'undefined'
      };
                    
                    const task${i}_response = await lambda.invoke({
                        FunctionName: '${SERVICE_PREFIX}-${service.name}',
                        Payload: JSON.stringify({ connection: task${i}_connection, config: task${i}_config, inputData: task${i}_inputData, outputPath: task${i}_outputPath }),
                    }).promise();
                
                    const task${i}_result = JSON.parse(task${i}_response.Payload);
        
                    const task${i}_success = task${i}_result.success;
                    
                    task${i}_outputData = task${i}_success && task${i}_result.data ? task${i}_result.data : { message: task${i}_result.message || task${i}_result.errorMessage || 'nothing for you this time : (' };
        
                    task${i}_outputLog['outputData'] = task${i}_outputData;
                    
                    const task${i}_timestamp = Date.now();
                    
                    task${i}_outputLog['timestamp'] = task${i}_timestamp;
                    
                    task${i}_outputLog['status'] = task${i}_success ? 'success' : 'fail';
        ${
          active
            ? `
                    if (task${i}_success) usage += 1;
        `
            : ''
        }
        ${
          active && tasks[i].returnData
            ? `
                    if (task${i}_success) outputData = task${i}_outputData;
        `
            : ''
        }
                } else {
        
                    const task${i}_timestamp = Date.now();
        
                    task${i}_outputLog['timestamp'] = task${i}_timestamp;
                    
                    task${i}_outputLog['status'] = 'filtered';
                }        
        ${
          active
            ? `
                logs.push(task${i}_outputLog);
        `
            : `
                if (testTaskIndex === ${i})
                    return callback(null, {
                        statusCode: 200,
                        headers: {
                            'Content-type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify({
                            success: true,
                            data: task${i}_outputLog
                        })
                    });
        `
        }`
    }

    return `
        const AWS = require('aws-sdk');
        const lambda = new AWS.Lambda({ region: "us-east-1" });
        
        module.exports.handler = async (event, context, callback) => {
        
            const userId = '${userId}';
            const botId = '${botId}';
        ${
          active
            ? `
            let usage = 0;
            const logs = [];
            let errorResult;
        `
            : ''
        }
            let outputData;
        
            try {
        
                let task0_outputData;
        
                if (event.body)
                    try {
                        if (event.headers['Content-type'] && event.isBase64Encoded && event.headers['Content-type'] === 'application/x-www-form-urlencoded') {
                            const buffer = new Buffer(event.body, 'base64');
                            const bodyString = buffer.toString('ascii').replace(/&/g, ",").replace(/=/g, ":");
                            const jsonBody = JSON.parse('{"' + decodeURI(bodyString) + '"}');
                    
                            task0_outputData = jsonBody;
                        }
                        else
                            task0_outputData = JSON.parse(event.body);
        
                    } catch (error) {
                        task0_outputData = event.body;
                    }
        
        ${
          active
            ? `   
                const task0_name = '${tasks[0].service.name}';
        
                const task0_timestamp = Date.now();
        
                logs.push({
                    name: task0_name,
                    outputData: task0_outputData,
                    timestamp: task0_timestamp,
                    status: 'success'
                });
        
                usage += 1;
        `
            : `
                const { testTaskIndex } = event;
        
                if (${active ? false : '!testTaskIndex'})
                    await lambda.invoke({
                        FunctionName: '${SERVICE_PREFIX}-sample-update',
                        Payload: JSON.stringify({ userId, botId, taskIndex: 0, status: 'success', outputData: task0_outputData })
                    }).promise();
        `
        }${innerCode}
            } catch (error) {
        ${
          active
            ? `
                errorResult = error;
        `
            : ''
        }
            }
        ${
          active
            ? `
            await lambda.invoke({
                FunctionName: '${SERVICE_PREFIX}-log-create',
                Payload: JSON.stringify({ userId, botId, usage, logs, error: errorResult })
            }).promise();
        `
            : ''
        }
            callback(null, {
                statusCode: 200,
                headers: {
                    'Content-type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    data: outputData
                })
            }); 
        };
        `
  }
}
