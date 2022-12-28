export interface IAppConfig {
  apiUrl?: string
  loginUrl?: string
  authorizeUrl?: string
  auth?: {
    type: string
    method: string
    url: string
    headers?: object
    fields?: {
      username: string
      password: string
    }
  }
}

export interface IApp {
  name: string
  appId: string
  config: IAppConfig
}
