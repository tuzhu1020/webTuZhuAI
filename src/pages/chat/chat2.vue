<script setup lang='ts'>
import { SEND_USER_MESSAGE_SERVICE } from '@/service/chat/index'
import sendUserMessageService from '@/service/chat/sendUserMessageService'
import { ArrowUpOutlined, DownOutlined, LoadingOutlined, UpOutlined } from '@ant-design/icons-vue'

import { Textarea as ATextarea, Tooltip as ATooltip, message } from 'ant-design-vue'

defineOptions({
  name: 'Chat',
})

const route = useRoute()
const router = useRouter()
const { id } = route.params
const isThink = ref<boolean>(false)
const content = ref<string>('')
const loading = ref<boolean>(false)
const [messageApi, contextHolder] = message.useMessage()
const chatMessageList = ref<Array<any>>([
//   {
//     content: '1',
//     role: 'user',
//     id: 1739426893684,
//     type: 'my',
//   },
//   {
//     data: [
//       {
//         index: 0,
//         message: {
//           role: 'assistant',
//           content: '<think>123123123</think>\n\n您好！请问有什么可以帮助您的？如果您有任何问题或需要建议，请随时告诉我。',
//         },
//         finish_reason: 'stop',
//       },
//     ],
//     isSpread: true,
//     role: 'assistant',
//     id: 1739426893979,
//     type: 'robot',
//   },
])
const chatContainer = ref(null)

watch(() => route.query, async (query) => {
  if (query.content) {
    content.value = query.content as string
    isThink.value = query.isThink === 'true'
    await sendChat()
  }
}, {
  immediate: true,
  deep: true,
})

async function sendChat() {
  if (content.value) {
    loading.value = true
    chatMessageList.value.push(generatorMyChatList(content.value))
    chatMessageList.value.push(generatorAiChatList([{}]))

    const startTime = new Date().getTime()

    try {
      const resp = await fetch(SEND_USER_MESSAGE_SERVICE.url, {
        method: SEND_USER_MESSAGE_SERVICE.method,
        headers: SEND_USER_MESSAGE_SERVICE.headers,
        body: JSON.stringify({
          model: 'deepseek-r1:1.5b',
          messages: [
            {
              role: 'user',
              content: content.value,
            },
          ],
          stream: true,
        }),
      })
      const reader = resp.body?.getReader()
      const decoder = new TextDecoder()
      const result = []
      while (1) {
        const { done, value } = await reader.read()
        const chunk = decoder.decode(value, { stream: true })
        const cleanedData = chunk.replace(/^data:\s*/g, '')
        try {
          result.push(JSON.parse(cleanedData))
        }
        catch (error) {
          console.error('JSON 解析错误:', error)
        }
        if (done) {
          console.log('Stream complete:', result)
          break
        }
      }
      // axios.create({ adapter: ['fetch', 'xhr', 'http'] })
      //   .request({
      //     ...SEND_USER_MESSAGE_SERVICE,
      //     data: {
      //       model: 'deepseek-r1:1.5b',
      //       messages: [
      //         {
      //           role: 'user',
      //           content: content.value,
      //         },
      //       ],
      //       stream: true,
      //     },
      //     responseType: 'stream',
      //   })
      //   .then((res) => {
      //     const reader = res.data.getReader() // 获取流的读取器
      //     const decoder = new TextDecoder() // 用于解码字节数据
      //     const result = '' // 用于存储接收到的数据

      //     // 处理每个数据块
      //     const processText = async ({ done, value }) => {
      //       if (done) {
      //         // 流结束时，打印所有接收到的结果
      //         console.log('Stream complete:', result)
      //         return
      //       }

      //       // 解码当前块并将其追加到结果中
      //       const decodedText = await decoder.decode(value, { stream: true })
      //       console.log(decodedText, 1)
      //       // buffer += decodedText // 拼接解码数据

      //       // 清理数据并去掉 'data: ' 前缀
      //       const cleanedData = decodedText.replace(/data:\s*/g, '') // 去除 data: 前缀

      //       // 用正则表达式匹配每个 JSON 对象
      //       const jsonPattern = /\{[^}]*\}/g // 匹配有效的 JSON 对象
      //       console.log(cleanedData, 2)
      //       try {
      //         // 这里确保 match[0] 是完整的 JSON 对象
      //         const jsonData = JSON.parse(cleanedData) // 解析匹配到的 JSON 字符串
      //         console.log('解析成功的 JSON 数据:', jsonData)
      //       }
      //       catch (error) {
      //         console.error('JSON 解析错误:', error)
      //       }
      //     }

      //     // 开始读取流
      //     reader.read().then(processText).catch((error) => {
      //       console.error('Error in initial read:', error)
      //     })
      //   })
      //   .catch((error) => {
      //     console.error('Error in axios request:', error)
      //   })

      // const data = await sendUserMessageService({
      //   model: 'deepseek-r1:1.5b',
      //   // model: 'Qwen2',
      //   messages: [
      //     {
      //       role: 'user',
      //       content: content.value,
      //     },
      //   ],
      //   stream: true,
      // })
      // console.log(data)
      // if (data.choices[0]) {
      //   data.choices = data.choices.map((item) => {
      //     const str = item.message.content || ''
      //     const match = str.match(/<think>([\s\S]*?)<\/think>/)
      //     // const match = '<think>I need to solve the simple aritejejr 1=1</think>yest'.match(/<think>(.*?)<\/think>/)
      //     console.log(match)
      //     return {
      //       ...item,
      //       _thinkContent: match ? match[1] : '',
      //       _content: item.message.content.replace(/<think>[\s\S]*?<\/think>\n\n/g, ''),
      //     }
      //   })
      //   chatMessageList.value[chatMessageList.value.length - 1] = generatorAiChatList(data.choices)
      //   console.log(chatMessageList.value)
      //   scrollToBottom()
      //   content.value = ''
      // }
    }
    catch ({ message }) {
      messageApi.error(message)
    }
    finally {
      loading.value = false
      chatMessageList.value[chatMessageList.value.length - 1].loading = false
      // 计算开始结束时间的秒数
      chatMessageList.value[chatMessageList.value.length - 1].thinkTime = (new Date().getTime() - startTime) / 1000
    }
  }
}

function generatorMyChatList(content: string) {
  return {
    content,
    role: 'user',
    id: +new Date().getTime(),
    type: 'my',
  }
}

function generatorAiChatList(data: object) {
  return {
    data,
    role: 'assistant',
    id: +new Date().getTime(),
    type: 'robot',
    loading: true,
    isSpread: true,
    isThink: isThink.value,
  }
}

function scrollToBottom() {
  if (chatContainer.value) {
    // chatContainer.value.scrollIntoView({ behavior: 'smooth', block: 'end' })
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    chatContainer.value.scrollTo(0, chatContainer.value.scrollHeight)
  }
}
</script>

<template>
  <div class="flex flex-col overflow-hidden">
    <div class="m-auto h-screen w-full flex flex-col">
      <div class="relative p-t-24">
        <div
          class="cursor-pointer overflow-hidden text-ellipsis rounded-12 p-x-12 p-y-8 text-center text-nowrap text-16 font-600 tracking-widest"
        >
          <!-- {{ id }} -->
          新对话
        </div>
        <div
          class="absolute bottom-0 h-32 w-full translate-y-[100%] from-[rgb(255,255,255)] bg-gradient-to-b opacity-70"
        />
      </div>
      <div ref="chatContainer" class="w-full flex-1 overflow-y-auto p-b-40 p-t-42">
        <div class="m-auto w-[var(--content-max-width)]">
          <template v-for="(item, index) in chatMessageList">
            <div v-if="item.type === 'my'" class="my m-b-16 flex justify-end whitespace-pre-wrap break-all p-b-32">
              <div class="rounded-14 bg-[var(--chat-my-bg)] p-x-20 p-y-12 text-16">
                {{ item.content }}
              </div>
            </div>
            <div v-else :class="[index + 1 === chatMessageList.length && loading ? 'm-b-0 p-b-0' : ' m-b-16 p-b-32']" class="robot flex items-start justify-start">
              <div class="m-r-16 border-width-1 border-color-#d5e4ff rounded-50% border-style-solid p-2">
                <img class="h-28 w-28" src="@/assets/images/logo.svg">
              </div>
              <div v-for="cur in item.data">
                <template v-if="item.isThink">
                  <div class="think m-b-12 flex-inline cursor-pointer items-center rounded-10 bg-[var(--chat-robot-bg)] p-x-12 p-y-8 lh-18 hover:bg-[var(--chat-robot-hover)]" @click="item.isSpread = !item.isSpread">
                    <img class="m-r-6 h-12 w-12" src="@/assets/images/think_icon.svg">
                    <div class="text-12 text-[var(--text-color)]">
                      {{ item.loading ? '正在思考中...' : `已深度思考（用时${item.thinkTime}s）` }}
                    </div>
                    <UpOutlined v-if="item.isSpread" class="m-l-12 h-10 w-10 text-10" @click="item.isSpread = false" />
                    <DownOutlined v-else class="m-l-12 h-10 w-10 text-10" @click="item.isSpread = true" />
                  </div>
                  <div v-if="item.isSpread" class="think-content m-b-14 whitespace-pre-wrap break-all border-l-width-2 border-l-color-[var(--chat-think-border)] border-l-style-solid p-l-12 text-16 text-[var(--chat-think-text)] lh-2em">
                    {{ cur._thinkContent }}
                  </div>
                </template>
                <div class="no-think whitespace-pre-wrap lh-2em">
                  {{ cur._content }}
                </div>
                <LoadingOutlined v-if="item.loading" class="m-b-24 m-t-6 cursor-not-allowed text-26 text-#909090" />
              </div>
            </div>
          </template>
        </div>

        <div v-if="chatMessageList.length" class="text-center">
          <div
            class="h-32 flex-inline cursor-pointer items-center rounded-14 bg-[var(--primary-bg-color)] p-x-10 text-center transition-all duration-600 hover:bg-[var(--button-hover)]"
            @click="router.push('/')"
          >
            <img class="m-r-10 h-18 w-18" src="@/assets/images/add_new_icon.svg">
            <div class="text-14 color-[var(--primary-color)]">
              开启新对话
            </div>
          </div>
        </div>
      </div>
      <div>
        <div
          class="m-auto w-[var(--content-max-width)] flex flex-col items-start overflow-hidden rounded-24 bg-[var(--label-bg-color)] p-10 shadow-inner"
        >
          <ATextarea
            v-model:value="content"
            placeholder="给 土猪 发送消息" autofocus :autosize="{ minRows: 2, maxRows: 10 }"
            class="max-w-full! min-w-full! w-full! resize-none! border-0! bg-transparent! text-16! focus:border-0! hover:border-0! focus:shadow-none!"
            @keydown.enter="sendChat"
          />
          <div class="mt-10 w-full flex items-center justify-between">
            <div>
              <div
                :class="[isThink ? 'bg-[var(--button-hover)] text-[var(--primary-color)] border-color-[var(--button-hover)]' : '']"
                class="h-28 flex cursor-pointer items-center justify-between border-width-1 border-color-[rgba(0,0,0,.12)] rounded-14 border-solid p-x-8 transition-all duration-300 hover:bg-[var(--button-hover-2)]"
                @click="isThink = !isThink"
              >
                <img
                  v-if="!isThink" src="@/assets/images/think_icon.svg"
                  class="m-r-4 h-18 w-18 cursor-pointer"
                >
                <img
                  v-else src="@/assets/images/think_active_icon.svg"
                  class="m-r-4 h-18 w-18 cursor-pointer"
                >
                <div class="text-12">
                  深度思考(R1)
                </div>
              </div>
            </div>

            <div>
              <div>
                <ATooltip placement="top">
                  <template v-if="!content" #title>
                    <span>请输入你的问题</span>
                  </template>
                  <div
                    :class="[content ? 'cursor-pointer bg-[var(--primary-color)] hover:opacity-80 transition-all duration-300' : 'cursor-not-allowed bg-[rgb(214,222,232)]']"
                    class="h-32 w-32 flex items-center justify-center rounded-50%"
                    @click="sendChat"
                  >
                    <ArrowUpOutlined v-if="!loading" class="text-#fafafa" />
                    <LoadingOutlined v-else class="cursor-not-allowed text-#fafafa" />
                  </div>
                </ATooltip>
              </div>
            </div>
          </div>
        </div>

        <footer class="m-y-6 text-center text-12 text-[var(--text-desc-color)]">
          内容由 AI 生成，请仔细甄别
        </footer>
      </div>
    </div>
    <contextHolder />
  </div>
</template>

<style lang='scss' scoped></style>
