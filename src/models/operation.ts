import { IAppService } from './app'
import { ISerivceConfig } from './service'

export interface IOperationInput {
  userId: string
  connectionId: string
  appConfig: IAppService
  serviceConfig: ISerivceConfig
  outputPath: string
  inputData: any
}
