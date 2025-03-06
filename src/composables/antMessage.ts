import { message } from 'ant-design-vue'

const [messageApi, contextHolderAntd] = message.useMessage()

export const $message = {
  success: (content: string) => {
    messageApi.success(content)
  },
  error: (content: string) => {
    messageApi.error(content)
  },
  info: (content: string) => {
    messageApi.info(content)
  },
  warning: (content: string) => {
    messageApi.warning(content)
  },
  loading: (content: string) => {
    messageApi.loading(content)
  },
  destroy: () => {
    messageApi.destroy()
  },
}

export const contextHolder = contextHolderAntd
