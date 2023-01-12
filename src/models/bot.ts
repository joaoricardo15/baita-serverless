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

export enum ConditionOperator {
  equals = 'equals',
  notEquals = 'notEquals',
  exists = 'exists',
  doNotExists = 'doNotExists',
  contains = 'contains',
  startsWith = 'startsWith',
  endsWith = 'endsWith',
}

export interface ITaskCondition extends IVariable {
  conditionOperator?: ConditionOperator
  conditionComparisonValue: DataType
}

export interface ITask {
  taskId: number
  app?: IApp
  service?: IService
  returnData?: boolean
  connectionId?: string
  inputData: IVariable[]
  sampleResult?: ITaskExecutionResult
  conditions?: ITaskCondition[][]
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
