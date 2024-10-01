import { User } from 'src/controllers/user'
import { ITaskExecutionInput } from 'src/models/bot/interface'
import { IContent } from 'src/models/user/interface'
import { validateContent } from 'src/models/user/schema'

const user = new User()

interface IGetTodo {}

export const getTodo = async (taskInput: ITaskExecutionInput<IGetTodo>) => {
  try {
    const { userId } = taskInput

    const data = await user.getTodo(userId)

    return data
  } catch (err) {
    throw err.message || err
  }
}

interface IPublishFeed {
  content: IContent | IContent[]
}

export const publishToFeed = async (
  taskInput: ITaskExecutionInput<IPublishFeed>
) => {
  try {
    const { userId, inputData } = taskInput

    const contentList = Array.isArray(inputData.content)
      ? inputData.content
      : [inputData.content]

    validateContent(contentList)
    
    await user.publishContent(userId, contentList)

    return {
      message: 'Content published successfully.',
    }
  } catch (err) {
    throw err.message || err
  }
}
