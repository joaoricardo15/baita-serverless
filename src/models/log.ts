import { TaskStatus } from './bot'

export interface ILog {
  name: string
  status: TaskStatus
  timestamp: number
  inputData: string | number | boolean | object | null
  outputData: string | number | boolean | object | null
}

export interface IBotLog {
  botId: string
  userId: string
  usage: number
  timestamp: number
  logs: ILog[]
}

export interface IBotUsage {
  total: number
}
