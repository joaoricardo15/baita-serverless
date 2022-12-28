import { IAppConfig } from './app'
import { DataType, ISerivceConfig } from './service'

export interface IOperationInput {
  userId: string
  connectionId: string
  appConfig: IAppConfig
  serviceConfig: ISerivceConfig
  outputPath?: string
  inputData: DataType
}
