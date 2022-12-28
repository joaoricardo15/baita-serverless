import { IApp } from './app'
import { IService, IVariable } from './service'

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
  inputData: any
  outputData: any
}

export interface ITaskCondition {
  type: ConditionType
  name: string
  label: string
  value?: any
  outputName?: string
  sampleValue?: string
  outputIndex?: number
}

export interface ITask {
  app?: IApp
  service?: IService
  connectionId?: string
  taskId: string
  inputData: IVariable[]
  sampleResult?: ITaskResult
  returnData?: boolean
  conditions?: {
    conditionId: number
    andConditions?: ITaskCondition[]
    orConditions?: ITaskCondition[]
  }[]
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
