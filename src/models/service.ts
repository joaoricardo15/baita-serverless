export enum ServiceType {
  invoke = 'invoke',
  trigger = 'trigger',
}

export enum ServiceName {
  webhook = 'webhook',
  schedule = 'schedule',
  code = 'code-execute',
  http = 'http-request',
  oauth2 = 'oauth2-request',
}

export enum InputSource {
  auth = 'authFields',
  input = 'inputFields',
  value = 'valueFields',
  service = 'serviceFields',
}

export enum VariableType {
  code = 'code',
  input = 'input',
  output = 'output',
  options = 'options',
}

export type DataType = string | number | boolean | object | null

export interface IVariable {
  type: VariableType
  name: string
  label: string
  value: DataType
  sampleValue: DataType
  outputIndex?: number
  outputName?: string
  customFieldId?: number
  taskIndex?: number
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
  inputSource?: InputSource
  inputFields?: IVariable[]
  outputPath?: string
  queryParams?: {
    paramName: string
    source: InputSource
    fieldName?: string
    value?: string | number
  }[]
  bodyParams?: {
    paramName: string
    source: InputSource
    fieldName?: string
    value?: string | number
  }[]
  urlParams?: {
    source: InputSource
    fieldName?: string
    value?: string | number
  }[]
}

export interface IService {
  type: ServiceType
  name: ServiceName
  label: string
  config: ISerivceConfig
}
