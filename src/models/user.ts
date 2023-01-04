export interface IUser {
  userId: string
  name: string
  email: string
}

export interface IPost {
  date: string
  author: string
  title: string
  body: string
  image?: string
  url?: string
}
