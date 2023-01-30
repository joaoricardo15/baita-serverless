import { IApp, IAppConfig } from '../app/interface'
import { ISerivceConfig, IService } from '../service/interface'

export enum VariableType {
  code = 'code',
  text = 'text',
  output = 'output',
  options = 'options',
  boolean = 'boolean',
  constant = 'constant',
  environment = 'environment',
}

export type DataType =
  | null
  | string
  | number
  | boolean
  | object
  | Array<string | number | boolean | object>

export interface IVariable {
  type: VariableType
  name: string
  label: string
  value: DataType
  sampleValue: DataType
  description?: string
  required?: boolean
  outputIndex?: number
  outputPath?: string
  customFieldId?: number
  groupName?: string
  options?: {
    label: string
    value: string
  }[]
}

export enum TaskExecutionStatus {
  fail = 'fail',
  filtered = 'filtered',
  success = 'success',
}

export interface ITaskExecutionInput<T> {
  userId: string
  botId: string
  connectionId?: string
  appConfig: IAppConfig
  serviceConfig: ISerivceConfig
  inputData: T
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

export interface IBotModel {
  modelId: string
  name: string
  image: string
  description: string
  tasks: ITask[]
}

export interface IBot {
  userId: string
  botId: string
  modelId?: string
  apiId: string
  name: string
  image: string
  description: string
  active: boolean
  triggerUrl: string
  triggerSamples: ITaskExecutionResult[]
  tasks: ITask[]
}
