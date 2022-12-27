'use strict'

import jwt from 'jsonwebtoken'

const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE
const AUTH0_CLIENT_PUBLIC_KEY = process.env.AUTH0_CLIENT_PUBLIC_KEY

exports.handler = async (event, context, callback) => {
  if (!event.authorizationToken) return callback('Unauthorized')

  const tokenParts = event.authorizationToken.split(' ')
  const tokenValue = tokenParts[1]

  if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue))
    return callback('Unauthorized')

  const options = { audience: AUTH0_AUDIENCE }

  try {
    const { verifyError, decoded } = await jwt.verify(
      tokenValue,
      AUTH0_CLIENT_PUBLIC_KEY,
      options
    )

    if (verifyError) return callback('Unauthorized')

    callback(null, {
      principalId: decoded.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn,
          },
        ],
      },
    })
  } catch (err) {
    callback('Unauthorized')
  }
}
