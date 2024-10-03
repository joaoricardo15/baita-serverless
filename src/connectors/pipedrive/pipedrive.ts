import axios from 'axios'

const SERVICE_API_URL = process.env.SERVICE_API_URL || ''
const PIPEDRIVE_AUTH_URL = process.env.PIPEDRIVE_AUTH_URL || ''
const PIPEDRIVE_CLIENT_ID = process.env.PIPEDRIVE_CLIENT_ID || ''
const PIPEDRIVE_CLIENT_SECRET = process.env.PIPEDRIVE_CLIENT_SECRET || ''

class Pipedrive {
  async getCredentials(
    code: string
  ): Promise<{ api_domain: string; access_token: string }> {
    try {
      const auth = {
        username: PIPEDRIVE_CLIENT_ID,
        password: PIPEDRIVE_CLIENT_SECRET,
      }

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      }

      const data = new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${SERVICE_API_URL}/connectors/pipedrive`,
      })

      const credentialsResult = await axios({
        auth,
        method: 'post',
        url: PIPEDRIVE_AUTH_URL,
        headers,
        data,
      })

      if (credentialsResult.status !== 200) throw credentialsResult.data

      return credentialsResult.data
    } catch (err) {
      throw err.response.data
    }
  }

  async getConnectionInfo(
    apiDomain: string,
    accessToken: string
  ): Promise<{ connectionId: string; email: string }> {
    try {
      const tokenResult = await axios({
        method: 'get',
        url: `${apiDomain}/users/me`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (tokenResult.status !== 200 || !tokenResult.data.success) {
        throw tokenResult.data
      }

      const { id, email } = tokenResult.data.data

      return { connectionId: id.toString(), email }
    } catch (err) {
      throw err.response.data
    }
  }

  desconstructAuthState(state: string): {
    appId: string
    userId: string
    botId: string
    taskIndex: number
  } {
    const splitedState = state.split(':')

    return {
      appId: splitedState[0],
      userId: splitedState[1],
      botId: splitedState[2],
      taskIndex: Number(splitedState[3]),
    }
  }
}

export default Pipedrive
