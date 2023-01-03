import { TaskExecutionStatus } from './bot'
import { DataType } from './service'

export interface ILog {
  name: string
  timestamp: number
  inputData: DataType
  outputData: DataType
  status: TaskExecutionStatus
}

export interface IBotLog {
  logs: ILog[]
  usage: number
  botId: string
  userId: string
  timestamp: number
}

export interface IBotUsage {
  total: number
}
