import admin from 'firebase-admin'
import { Message } from 'firebase-admin/lib/messaging/messaging-api'
import { ITaskExecutionInput } from 'src/models/bot/interface'
import serviceAccount from 'src/partners/firebase/secrets.json'

const SERVICE_SITE_URL = process.env.SERVICE_SITE_URL || ''

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
})

interface ISendNotification {
  token: string
  url?: string
  notification: {
    title: string
    body: string
    timestamp?: number
    image?: string
    icon?: string
    actions?: {
      action: string
      title: string
    }[]
  }
  data?: any
}

export const sendNotification = async (
  taskInput: ITaskExecutionInput<ISendNotification>
) => {
  try {
    const { botId, inputData } = taskInput

    const message: Message = {
      token: inputData.token,
      webpush: {
        headers: {
          Topic: botId,
          Urgency: 'high',
        },
        notification: {
          tag: botId,
          silent: false,
          renotify: false,
          requireInteraction: true,
          badge: `${SERVICE_SITE_URL}/logo_badge.png`,
          ...inputData.notification,
          icon:
            inputData.notification.icon ||
            `${SERVICE_SITE_URL}/logo_background.png`,
        },
        fcmOptions: {
          link: inputData.url || SERVICE_SITE_URL,
        },
      },
      fcmOptions: {
        analyticsLabel: botId,
      },
      data: inputData.data,
    }

    console.log('sendNotification', JSON.stringify(message))

    return await admin.messaging().send(message)
  } catch (err) {
    throw err.message
  }
}
