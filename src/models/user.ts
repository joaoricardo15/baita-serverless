export interface IUser {
  userId: string
  name: string
  email: string
}

export interface IPost {
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
