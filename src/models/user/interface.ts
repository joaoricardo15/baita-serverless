export interface IUser {
  userId: string
  name: string
  email: string
}

export interface IContent {
  contentId: string
  body: string
  date: string
  header?: string
  image?: string
  url?: string
  likes?: number
  comments?: number
  author: {
    name: string
    accountName?: string
    descripion?: string
    image?: string
    url?: string
    location?: string
    followers?: number
  }
}

export interface ITodoTask {
  taskId: string
  title: string
  body?: string
  done: boolean
  createdAt: number
  updatedAt: number
}
