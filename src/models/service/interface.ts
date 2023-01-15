import { IVariable } from '../bot/interface'

export enum ServiceType {
  invoke = 'invoke',
  trigger = 'trigger',
}

export enum ServiceName {
  webhook = 'webhook',
  schedule = 'schedule',
  todo = 'get-todo',
  code = 'code-execute',
  method = 'method-execute',
  data = 'data-transform',
  http = 'http-request',
  oauth2 = 'oauth2-request',
  queue = 'queue-publish',
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
