'use strict'

import { Api, BotStatus } from 'src/utils/api'
import { App } from 'src/controllers/app'
import { validateTasks } from 'src/models/bot/schema'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const app = new App()

  try {
    const body = JSON.parse(event.body)

    const { modelId, name, description, image, tasks } = body

    validateTasks(tasks)

    const data = await app.publishBotModel({
      modelId,
      name,
      image,
      description,
      tasks,
    })

    api.httpResponse(callback, BotStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, BotStatus.fail, err)
  }
}
