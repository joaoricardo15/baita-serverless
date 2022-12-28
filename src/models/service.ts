import { IApp } from './app'

export enum ServiceType {
  invoke = 'invoke',
  trigger = 'trigger',
}

export enum ServiceName {
  webhook = 'webhook',
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

export interface IVariable {
  type: VariableType
  name: string
  label: string
  value?: any
  sampleValue?: any
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
    value?: string
  }[]
  bodyParams?: {
    paramName: string
    source: InputSource
    fieldName?: string
    value?: string
  }[]
  urlParams?: {
    source: InputSource
    fieldName?: string
    value?: string
  }[]
}

export interface IService {
  type: ServiceType
  name: ServiceName
  label: string
  config: ISerivceConfig
}

export interface IServiceApp {
  service: IService
  app: IApp
}
