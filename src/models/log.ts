import { TaskStatus } from './bot'
import { DataType } from './service'

export interface ILog {
  name: string
  status: TaskStatus
  timestamp: number
  inputData: DataType
  outputData: DataType
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
