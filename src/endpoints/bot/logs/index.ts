import Api, { ApiRequestStatus } from 'src/utils/api'
import Bot from 'src/controllers/bot'

exports.handler = async (event, context, callback) => {
  const api = new Api(event, context)
  const bot = new Bot()

  try {
    const { botId } = event.pathParameters

    const data = await bot.getBotLogs(
      botId,
      event.queryStringParameters?.searchTerm
    )

    api.httpResponse(callback, ApiRequestStatus.success, undefined, data)
  } catch (err) {
    api.httpResponse(callback, ApiRequestStatus.fail, err)
  }
}
