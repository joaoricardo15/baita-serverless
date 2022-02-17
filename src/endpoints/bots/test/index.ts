import AWS from "aws-sdk";

const lambda = new AWS.Lambda();

const SERVICE_PREFIX = process.env.SERVICE_PREFIX || "";
const BOT_PREFIX = process.env.BOT_PREFIX || "";

exports.handler = (event, context, callback) => {
  let test_input_data;

  try {
    test_input_data = JSON.parse(event.body);
  } catch (error) {
    test_input_data = event.body;
  }

  const { user_id, bot_id, task_index } = test_input_data;

  lambda
    .invoke({
      FunctionName: `${BOT_PREFIX}-${bot_id}`,
      Payload: JSON.stringify({ test_task_index: task_index }),
    })
    .promise()
    .then((task_tesponse: any) => {
      const invoke_result = JSON.parse(task_tesponse.Payload);

      const task_result = JSON.parse(invoke_result.body);

      const task_success = task_result.success;

      const task_output_data =
        task_success && task_result.data
          ? task_result.data
          : {
              message:
                task_result.message ||
                task_result.errorMessage ||
                "nothing for you this time : (",
            };

      lambda
        .invoke({
          FunctionName: `${SERVICE_PREFIX}-sample-update`,
          Payload: JSON.stringify({
            user_id,
            bot_id,
            task_index,
            status: task_output_data.status,
            input_data: task_output_data.input_data,
            output_data: task_output_data.output_data,
          }),
        })
        .promise()
        .then((update_response:any) => {
          const update_result = JSON.parse(update_response.Payload);

          callback(null, {
            statusCode: 200,
            headers: {
              "Content-type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              success: true,
              data: update_result.data,
            }),
          });
        })
        .catch(callback);
    })
    .catch(callback);
};
