import { TaskStatus } from './bot'

export interface ILog {
  name: string
  status: TaskStatus
  timestamp: number
  inputData: any
  outputData: any
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
