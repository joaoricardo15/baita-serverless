"use strict";
import JSZip from "jszip";

const zip = new JSZip();

const SERVICE_PREFIX = process.env.SERVICE_PREFIX || "";

const comparationExpressions = {
  equals: "==",
  diferent: "!=",
  exists: "",
  donotexists: "",
};

export class Code {
  async getCodeFile(code) {
    zip.file("index.js", code);

    const archive = await zip.generateAsync({ type: "base64" });

    return Buffer.from(archive, "base64");
  }

  getSampleCode(user_id: string, bot_id: string): string {
    return `
        const AWS = require('aws-sdk');
        const lambda = new AWS.Lambda({ region: "us-east-1" });
        
        const user_id = '${user_id}';
        const bot_id = '${bot_id}';
        
        module.exports.handler = async (event, context, callback) => {
        
            let task0_output_data;
            
            if (event.body)
                try {
                    task0_output_data = JSON.parse(event.body);
                } catch (error) {
                    task0_output_data = event.body;
                }
            
            await lambda.invoke({
                FunctionName: '${SERVICE_PREFIX}-sample-update',
                Payload: JSON.stringify({ user_id, bot_id, task_index: 0, status: 'success', output_data: task0_output_data })
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
    `;
  }

  getBotCode(user_id: string, bot_id: string, active: boolean, tasks) {
    if (
      !tasks ||
      !tasks.length ||
      tasks.length < 2 ||
      tasks[0].type !== "trigger"
    )
      throw "invalid bot config";

    let innerCode = "";

    for (let i = 1; i < tasks.length; i++) {
      const app = tasks[i].app;
      const service = tasks[i].service;

      let input_fields = "";
      if (service.service_config.input_source === "service_fields")
        for (let j = 0; j < service.service_config.input_fields.length; j++) {
          const var_name = service.service_config.input_fields[j].var_name;

          const input_field = tasks[i].input_data.find(
            (x) => x.var_name === var_name
          );

          if (
            !service.service_name ||
            !service.service_config ||
            !tasks[i].input_data ||
            !input_field
          )
            throw "invalid bot config";

          if (
            var_name &&
            ((!active && input_field.sample_value) ||
              input_field.value ||
              (input_field.output_index !== undefined &&
                input_field.output_name))
          )
            input_fields += `'${var_name}': ${
              !active
                ? `\`${input_field.sample_value}\``
                : input_field.value
                ? `\`${input_field.value}\``
                : `task${input_field.output_index}_output_data['${input_field.output_name}']`
            },`;
        }
      else if (service.service_config.input_source === "input_fields")
        for (let j = 0; j < tasks[i].input_data.length; j++) {
          const input_field = tasks[i].input_data[j];

          if (
            input_field.var_name &&
            ((!active && input_field.sample_value) ||
              input_field.value ||
              (input_field.output_index !== undefined &&
                input_field.output_name))
          )
            input_fields += `'${input_field.var_name}': ${
              !active
                ? `\`${input_field.sample_value}\``
                : input_field.value
                ? `\`${input_field.value}\``
                : `task${input_field.output_index}_output_data['${input_field.output_name}']`
            },`;
        }

      let conditions = "";
      if (tasks[i].conditions)
        for (let j = 0; j < tasks[i].conditions.length; j++) {
          let andConditions = "";

          for (
            let k = 0;
            k < tasks[i].conditions[j].andConditions.length;
            k++
          ) {
            const andCondition = tasks[i].conditions[j].andConditions[k];

            const condition_value = !active
              ? `\`${andCondition.sample_value}\``
              : andCondition.value
              ? `\`${andCondition.value}\``
              : `task${andCondition.output_index}_output_data['${andCondition.output_name}']`;

            const condition_expression =
              comparationExpressions[andCondition.comparation_type];

            const comparation_value = andCondition.comparation_value;

            if (condition_value && andCondition.comparation_type)
              andConditions += `${k === 0 ? "" : " && "}${
                andCondition.comparation_type === "donotexists"
                  ? `!${condition_value}`
                  : andCondition.comparation_type === "exists"
                  ? `${condition_value}`
                  : `${condition_value} ${condition_expression} ${comparation_value}`
              }`;
          }
          if (andConditions)
            conditions += `${j === 0 ? "" : " || "}(${andConditions})`;
        }

      innerCode += `
                const task${i}_name = '${tasks[i].service.name}';
        
                const task${i}_input_data = { ${input_fields} };
        
                let task${i}_output_data = {};
                
                let task${i}_output_log = {
                    name: task${i}_name,
                    input_data: task${i}_input_data
                };
        
                if (${active ? true : `test_task_index === ${i}`} && ${
        conditions || true
      }) {
                
                    const task${i}_connection = ${JSON.stringify({
        user_id,
        connection_id: tasks[i].connection_id,
        app_config: app.app_config,
      })};
            
                    const task${i}_config = ${JSON.stringify(
        service.service_config
      )};
                    
                    const task${i}_output_path = ${
        service.service_config.output_path
          ? `'${service.service_config.output_path}'`
          : "undefined"
      };
                    
                    const task${i}_response = await lambda.invoke({
                        FunctionName: '${SERVICE_PREFIX}-${
        service.service_name
      }',
                        Payload: JSON.stringify({ connection: task${i}_connection, config: task${i}_config, input_data: task${i}_input_data, output_path: task${i}_output_path }),
                    }).promise();
                
                    const task${i}_result = JSON.parse(task${i}_response.Payload);
        
                    const task${i}_success = task${i}_result.success;
                    
                    task${i}_output_data = task${i}_success && task${i}_result.data ? task${i}_result.data : { message: task${i}_result.message || task${i}_result.errorMessage || 'nothing for you this time : (' };
        
                    task${i}_output_log['output_data'] = task${i}_output_data;
                    
                    const task${i}_timestamp = Date.now();
                    
                    task${i}_output_log['timestamp'] = task${i}_timestamp;
                    
                    task${i}_output_log['status'] = task${i}_success ? 'success' : 'fail';
        ${
          active
            ? `
                    if (task${i}_success) usage += 1;
        `
            : ""
        }
        ${
          active && tasks[i].bot_output
            ? `
                    if (task${i}_success) output_data = task${i}_output_data;
        `
            : ""
        }
                } else {
        
                    const task${i}_timestamp = Date.now();
        
                    task${i}_output_log['timestamp'] = task${i}_timestamp;
                    
                    task${i}_output_log['status'] = 'filtered';
                }        
        ${
          active
            ? `
                logs.push(task${i}_output_log);
        `
            : `
                if (test_task_index === ${i})
                    return callback(null, {
                        statusCode: 200,
                        headers: {
                            'Content-type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify({
                            success: true,
                            data: task${i}_output_log
                        })
                    });
        `
        }`;
    }

    return `
        const AWS = require('aws-sdk');
        const lambda = new AWS.Lambda({ region: "us-east-1" });
        
        module.exports.handler = async (event, context, callback) => {
        
            const user_id = '${user_id}';
            const bot_id = '${bot_id}';
        ${
          active
            ? `
            let usage = 0;
            const logs = [];
            let error_result;
        `
            : ""
        }
            let output_data;
        
            try {
        
                let task0_output_data;
        
                if (event.body)
                    try {
                        if (event.headers['Content-type'] && event.isBase64Encoded && event.headers['Content-type'] === 'application/x-www-form-urlencoded') {
                            const buffer = new Buffer(event.body, 'base64');
                            const bodyString = buffer.toString('ascii').replace(/&/g, ",").replace(/=/g, ":");
                            const jsonBody = JSON.parse('{"' + decodeURI(bodyString) + '"}');
                    
                            task0_output_data = jsonBody;
                        }
                        else
                            task0_output_data = JSON.parse(event.body);
        
                    } catch (error) {
                        task0_output_data = event.body;
                    }
        
        ${
          active
            ? `   
                const task0_name = '${tasks[0].service.name}';
        
                const task0_timestamp = Date.now();
        
                logs.push({
                    name: task0_name,
                    output_data: task0_output_data,
                    timestamp: task0_timestamp,
                    status: 'success'
                });
        
                usage += 1;
        `
            : `
                const { test_task_index } = event;
        
                if (${active ? false : "!test_task_index"})
                    await lambda.invoke({
                        FunctionName: '${SERVICE_PREFIX}-sample-update',
                        Payload: JSON.stringify({ user_id, bot_id, task_index: 0, status: 'success', output_data: task0_output_data })
                    }).promise();
        `
        }${innerCode}
            } catch (error) {
        ${
          active
            ? `
                error_result = error;
        `
            : ""
        }
            }
        ${
          active
            ? `
            await lambda.invoke({
                FunctionName: '${SERVICE_PREFIX}-log-create',
                Payload: JSON.stringify({ user_id, bot_id, usage, logs, error: error_result })
            }).promise();
        `
            : ""
        }
            callback(null, {
                statusCode: 200,
                headers: {
                    'Content-type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    data: output_data
                })
            }); 
        };
        `;
  }
}
