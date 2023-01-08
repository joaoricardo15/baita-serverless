export enum ServiceType {
  invoke = 'invoke',
  trigger = 'trigger',
}

export enum ServiceName {
  webhook = 'webhook',
  schedule = 'schedule',
  code = 'code-execute',
  data = 'data-transform',
  http = 'http-request',
  oauth2 = 'oauth2-request',
  queue = 'queue-publish',
}

export enum VariableType {
  code = 'code',
  text = 'text',
  output = 'output',
  options = 'options',
  boolean = 'boolean',
  constant = 'constant',
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

export interface ISerivceConfig {
  path?: string
  method?: string
  customFields?: boolean
  inputFields?: IVariable[]
  outputPath?: string
  outputMapping?: {
    [key: string]: string
  }
}

export interface IService {
  type: ServiceType
  name: ServiceName
  label: string
  config: ISerivceConfig
}
