export interface ICredential {
    refresh_token?: string
    access_token?: string
  }
  
  export interface IAppConnection {
    appId: string
    userId: string
    connectionId: string
    email: string
    name: string
    credentials: ICredential
  }