import { IAppConfig } from './app'
import { ISerivceConfig } from './service'

export interface IOperationInput {
  userId: string
  connectionId: string
  appConfig: IAppConfig
  serviceConfig: ISerivceConfig
  outputPath?: string
  inputData: string | number | boolean | object | null
}
