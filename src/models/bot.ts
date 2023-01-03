import { IApp } from './app'
import { DataType, IService, IVariable } from './service'

export enum TaskStatus {
  fail = 'fail',
  filtered = 'filtered',
  success = 'success',
}

export enum ConditionType {
  exists = 'exists',
  donotexists = 'donotexists',
  contains = 'contains',
  startsWith = 'startsWith',
  endsWith = 'endsWith',
}

export interface ITaskResult {
  status: TaskStatus
  timestamp: number
  inputData: DataType
  outputData: DataType
}

export interface ICondition {
  type: ConditionType
  name: string
  label: string
  value: DataType
  sampleValue: DataType
  outputIndex?: number
}

export interface ITaskCondition {
  conditionId: number
  andConditions?: ICondition[]
  orConditions?: ICondition[]
}

export interface ITask {
  app?: IApp
  service?: IService
  connectionId?: string
  taskId: number
  inputData: IVariable[]
  sampleResult?: ITaskResult
  returnData?: boolean
  conditions?: ITaskCondition[]
}

export interface IBot {
  botId: string
  userId: string
  apiId: string
  name: string
  active: boolean
  triggerUrl: string
  triggerSamples: ITaskResult[]
  tasks: ITask[]
}
