'use strict'

import JSZip from 'jszip'
import { ConditionType, ITask, ITaskCondition } from 'src/models/bot'
import { IVariable, InputSource } from 'src/models/service'

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

  getInputStringFromService(
    isActive: boolean,
    inputFields: IVariable[],
    inputData: any
  ) {
    let inputString = ''

    for (let j = 0; j < inputFields.length; j++) {
      const name = inputFields[j].name

      const inputField = inputData.find((x) => x.name === name)

      if (!inputField) throw 'invalid bot config'

      if (!isActive && inputField.sampleValue) {
        inputString += `'${name}': \`${inputField.sampleValue}\`,`
      } else if (
        inputField.outputName &&
        inputField.outputIndex !== undefined
      ) {
        inputString += `'${name}': task${inputField.outputIndex}_outputData['${inputField.outputName}'],`
      } else if (inputField.value) {
        inputString += `'${name}': \`${inputField.value}\`,`
      }
    }

    return inputString
  }

  getInputStringFromInput(isActive: boolean, inputData: any) {
    let inputString = ''

    for (let j = 0; j < inputData.length; j++) {
      const inputField = inputData[j]

      if (!isActive && inputField.sampleValue) {
        inputString += `'${inputField.name}': \`${inputField.sampleValue}\`,`
      } else if (
        inputField.outputName &&
        inputField.outputIndex !== undefined
      ) {
        inputString += `'${inputField.name}': task${inputField.outputIndex}_outputData['${inputField.outputName}'],`
      } else if (inputField.value) {
        inputString += `'${inputField.name}': \`${inputField.value}\`,`
      }
    }

    return inputString
  }

  getConditionsString(isActive: boolean, conditions: ITaskCondition[]) {
    let andConditionsString = ''

    for (let j = 0; j < conditions.length; j++) {
      const andConditions = conditions[j].andConditions

      if (andConditions) {
        for (let k = 0; k < andConditions.length; k++) {
          const andCondition = andConditions[k]

          let conditionValue = ''
          if (!isActive) {
            conditionValue = `\`${andCondition.sampleValue}\``
          } else if (
            andCondition.outputName &&
            andCondition.outputIndex !== undefined
          ) {
            conditionValue = `task${andCondition.outputIndex}_outputData['${andCondition.outputName}']`
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

  getBotInnerCode(userId: string, active: boolean, tasks: ITask[]) {
    let innerCode = ''

    for (let i = 1; i < tasks.length; i++) {
      const task = tasks[i]
      const app = task.app
      const service = task.service
      const conditions = task.conditions

      let inputDataString = ''
      if (service) {
        if (
          service.config.inputFields &&
          service.config.inputSource === InputSource.service
        ) {
          inputDataString += this.getInputStringFromService(
            active,
            service.config.inputFields,
            task.inputData
          )
        } else if (service.config.inputSource === InputSource.input) {
          inputDataString += this.getInputStringFromInput(
            active,
            task.inputData
          )
        }
      }

      let conditionsString = ''
      if (conditions) {
        conditionsString += this.getConditionsString(active, conditions)
      }

      innerCode += `
                const task${i}_name = '${service?.name}';
        
                const task${i}_inputData = { ${inputDataString} };
        
                let task${i}_outputData = {};
                
                let task${i}_outputLog = {
                    name: task${i}_name,
                    inputData: task${i}_inputData
                };
        
                if (${active ? true : `testTaskIndex === ${i}`} && ${
        conditionsString || true
      }) {
                    const task${i}_appConfig = ${JSON.stringify(app?.config)};
            
                    const task${i}_serviceConfig = ${JSON.stringify(
        service?.config
      )};
                    
                    const task${i}_outputPath = ${
        service?.config.outputPath
          ? `'${service.config.outputPath}'`
          : 'undefined'
      };
                    
                    const task${i}_response = await lambda.invoke({
                        FunctionName: '${SERVICE_PREFIX}-${service?.name}',
                        Payload: JSON.stringify({ userId: '${userId}', connectionId: '${
        task.connectionId
      }', appConfig: task${i}_appConfig, serviceConfig: task${i}_serviceConfig, inputData: task${i}_inputData, outputPath: task${i}_outputPath }),
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
          active && task.returnData
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

    return innerCode
  }

  getBotCode(userId: string, botId: string, active: boolean, tasks: ITask[]) {
    const innerCode = this.getBotInnerCode(userId, active, tasks)

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
                const task0_name = '${tasks[0].service?.name}';
        
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
