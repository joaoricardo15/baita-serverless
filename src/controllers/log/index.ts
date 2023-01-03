'use strict'

import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs'

const LOGS_TABLE = process.env.LOGS_TABLE || ''
const SERVICE_PREFIX = process.env.SERVICE_PREFIX || ''
export class Log {
  async getBotLogs(botId: string, searchTerms: string | string[] | undefined) {
    const cloudWatchLogs = new CloudWatchLogs({})

    try {
      const botPrefix = `${SERVICE_PREFIX}-${botId}`

      let queryString =
        'fields @message | sort @timestamp desc | filter @message like "\tINFO\t"'

      if (searchTerms) {
        if (Array.isArray(searchTerms))
          searchTerms.forEach(
            (term) => (queryString += ` | filter @message like /(?i)${term}/`)
          )
        else queryString += ` | filter @message like /(?i)${searchTerms}/`
      }

      const startResponse = await cloudWatchLogs.startQuery({
        limit: 20,
        queryString,
        endTime: Date.now(),
        startTime: Date.now() - 10 * 24 * 60 * 60 * 1000, // last 10 days
        logGroupName: `/aws/lambda/${botPrefix}`,
      })

      let queryResponse
      while (!queryResponse || queryResponse.status !== 'Complete') {
        await new Promise((resolve) => setTimeout(resolve, 100))

        queryResponse = await cloudWatchLogs.getQueryResults({
          queryId: startResponse.queryId,
        })
      }

      return queryResponse?.results?.map((result) =>
        JSON.parse(
          result
            .find((obj) => obj.field === '@message')
            .value.split('\tINFO\t')[1]
        )
      )
    } catch (err) {
      throw err.message
    }
  }
}
