import { User } from 'src/controllers/user'
import { ITaskExecutionInput } from 'src/models/bot/interface'
import { IContent } from 'src/models/user/interface'
import { validateContent } from 'src/models/user/schema'

const user = new User()

export const getTodo = async (taskInput: ITaskExecutionInput<undefined>) => {
  try {
    const { userId } = taskInput

    const data = await user.getTodo(userId)

    return data
  } catch (err) {
    throw err.message
  }
}

export const publishToFeed = async (
  taskInput: ITaskExecutionInput<{ content: IContent[] }>
) => {
  try {
    const { userId, inputData } = taskInput

    const { content } = inputData

    let contentList
    if (Array.isArray(content)) {
      contentList = content
    } else {
      contentList = [content]
    }

    validateContent(contentList)
    await user.publishContent(userId, contentList)

    return {
      message: 'Content published successfully.',
    }
  } catch (err) {
    throw err.message
  }
}
