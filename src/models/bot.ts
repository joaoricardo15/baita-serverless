import { IApp, IAppConfig } from './app'
import { DataType, ISerivceConfig, IService, IVariable } from './service'

export enum TaskExecutionStatus {
  fail = 'fail',
  filtered = 'filtered',
  success = 'success',
}

export interface ITaskExecutionInput {
  userId: string
  connectionId?: string
  appConfig: IAppConfig
  serviceConfig: ISerivceConfig
  inputData: DataType
}

export interface ITaskExecutionResult {
  timestamp: number
  inputData: DataType
  outputData: DataType
  status: TaskExecutionStatus
}

export enum ConditionType {
  exists = 'exists',
  donotexists = 'donotexists',
  contains = 'contains',
  startsWith = 'startsWith',
  endsWith = 'endsWith',
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
  taskId: number
  app?: IApp
  service?: IService
  returnData?: boolean
  connectionId?: string
  inputData: IVariable[]
  conditions?: ITaskCondition[]
  sampleResult?: ITaskExecutionResult
}

export interface IBot {
  botId: string
  userId: string
  apiId: string
  name: string
  active: boolean
  triggerUrl: string
  triggerSamples: ITaskExecutionResult[]
  tasks: ITask[]
}
