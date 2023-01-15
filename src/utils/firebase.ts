import admin from 'firebase-admin'
import { ITaskExecutionInput } from 'src/models/bot/interface'
import serviceAccount from '../partners/firebase/secrets.json'

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
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    })

    const { botId, inputData } = taskInput

    return await admin.messaging().send({
      token: inputData.token,
      webpush: {
        headers: {
          // TTL: '86400',
          Topic: botId,
          Urgency: 'high', // 'very-low', 'low', 'normal', 'high'
        },
        notification: {
          tag: botId,
          silent: false,
          renotify: false,
          requireInteraction: true,
          vibrate: [200, 300, 200, 300],
          badge: 'https://www.baita.help/logo.png',
          ...inputData.notification,
        },
        fcmOptions: {
          link: inputData.url || 'https://www.baita.help',
        },
      },
      fcmOptions: {
        analyticsLabel: botId,
      },
      data: inputData.data,
    })
  } catch (err) {
    err.message
  }
}
