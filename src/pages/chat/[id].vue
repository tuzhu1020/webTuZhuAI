<script setup lang='ts'>
import { IS_PROD } from "@/config";
import { AI_IDENTITY_AI_VALUE, AI_IDENTITY_USER_VALUE } from "@/constant/enum";

import getChatDetailService from "@/service/chat/getChatDetailService";
import getSearchKnowledgeService from "@/service/chat/getSearchKnowledgeService";
import { SEND_USER_MESSAGE_SERVICE } from "@/service/chat/index";
import reChatNameService from "@/service/chat/reChatNameService";
import saveChatRecordService from "@/service/chat/saveChatRecordService";

import { useUserStore } from "@/stores/user";

import SearchResult from "@/weights/Chat/SearchResult/index.vue";
import Tools from "@/weights/Chat/Tools/index.vue";

import {
  ArrowUpOutlined,
  DownOutlined,
  LoadingOutlined,
  PauseOutlined,
  RightOutlined,
  SearchOutlined,
  UpOutlined,
} from "@ant-design/icons-vue";
import {
  Input as AInput,
  Spin as ASpin,
  Textarea as ATextarea,
  Tooltip as ATooltip,
  message,
} from "ant-design-vue";
import { MdPreview } from "md-editor-v3";

import "md-editor-v3/lib/style.css";

defineOptions({
  name: "Chat",
});

const route = useRoute();
const router = useRouter();
const isThink = ref<boolean>(false);
const isRepository = ref<boolean>(false);
const content = ref<string>("");
const pauseing = ref<boolean>(true);
const [messageApi, contextHolder] = message.useMessage();
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
]);
const chatContainer = ref(null);
const controller = ref<any>(null);
// const maxLen = 26000 // 模型最大字符数(关联)
const loading = ref<boolean>(false);
const spinning = ref<boolean>(false);
const chatTitle = ref<string>("");
const oldChatTitle = ref<string>();
const userStore = useUserStore();
const visibleSearchResult = ref<boolean>(false);
const searchResultData = ref<any[]>([]);

const chatId = computed(() => route.params?.id as string);
// const isFirstEntry = computed(() => !chatMessageList.value.length)

watch(
  () => route.query,
  async (query) => {
    isThink.value = query.isThink === "true";
    isRepository.value = query.isRepository === "true";
    // await sendChat()
  },
  {
    immediate: true,
    deep: true,
  }
);

watch(
  chatId,
  () => {
    getChatDetail();
  },
  { immediate: true }
);
watch(
  () => userStore.chatList,
  (newVal: any[]) => {
    newVal.forEach((item: { list: any[] }) => {
      item.list.forEach((cur: { id: number | string; title: string }) => {
        if (String(cur.id) === chatId.value) {
          chatTitle.value = cur.title;
        }
      });
    });
  },
  {
    deep: true,
  }
);

function handleEnterSendChat(event) {
  if (event.keyCode === 13) {
    if (!event.shiftKey) {
      event.preventDefault();
      sendChat();
    } else {
      const selectionStart = event.target.selectionStart;
      content.value = `${content.value.substring(
        0,
        selectionStart
      )}\n${content.value.substring(selectionStart)}`;
      nextTick(() => {
        event.target.setSelectionRange(selectionStart + 1, selectionStart + 1);
      });
    }
  }
}

function parseJsonLikeData(content: any) {
  if (content?.startsWith("data: ")) {
    const dataString = content.substring(6).trim();

    if (dataString === "[DONE]") {
      return {
        done: true,
      };
    }
    try {
      return JSON.parse(dataString);
    } catch (error) {
      console.error("JSON parsing error:", error);
    }
  }
  return null;
}

function parseMergeObj(lastChatItem: any, data: any) {
  const newData = Object.assign({}, lastChatItem);
  newData.choices.forEach((item, index) => {
    const nextData = data.choices[index]?.delta?.content || "";
    item.delta.content = nextData
      ? (item.delta.content || "") + nextData
      : item.delta.content || "";
    const nextDataReasoning =
      data.choices[index]?.delta?.reasoning_content || "";
    item.delta.reasoning_content = nextDataReasoning
      ? (item.delta.reasoning_content || "") + nextDataReasoning
      : item.delta.reasoning_content || "";
  });
  return newData;
}

async function sendChat() {
  if (content.value && !loading.value) {
    loading.value = true;
    chatMessageList.value.push(generatorMyChatList(content.value));
    saveChatRecord();

    const startTime = new Date().getTime();
    controller.value = new AbortController();
    const signal = controller.value.signal;
    let docs = null;

    chatMessageList.value.push(generatorAiChatList({}));
    setTimeout(() => {
      scrollToBottom();
    }, 500);

    try {
      if (isRepository.value) {
        const data = await getSearchKnowledgeService({
          query: content.value,
        });
        docs = data || [];
      }

      content.value = "";

      const resp = await fetch(SEND_USER_MESSAGE_SERVICE.url, {
        signal,
        method: SEND_USER_MESSAGE_SERVICE.method,
        headers: {
          ...SEND_USER_MESSAGE_SERVICE.headers,
          Authorization: userStore.token,
        },
        body: JSON.stringify({
          // docs,
          // model: 'deepseek-r1:32b',
          model: isThink.value ? "deepseek-reasoner" : "deepseek-chat",
          // model:  'deepseek-r1:32b',
          // model: 'Qwen2',
          // messages: [
          //   {
          //     role: 'system',
          //     content: content.value,
          //   },
          //   {
          //     role: 'user',
          //     content: content.value,
          //   },
          // ],
          // rag: isRepository.value,
          messages: chatMessageList.value
            .map((item) => {
              const isUser = item.role === "user";
              return {
                role: isUser ? item.role : "assistant",
                content: isUser
                  ? item.content
                  : item.choices?.[0]?.delta.content,
              };
            })
            .filter((item) => item.content),
          stream: true,
        }),
      });

      pauseing.value = false;
      // console.log(resp,'resp');

      // const reader = resp.body?.pipeThrough(new TextDecoderStream()).pipeThrough(TransformUtils.splitStream('\n')).getReader()
      const reader = resp?.body?.getReader();
      // console.log(reader,'reader');

      const nosupportReader = resp?.body?.getReader;
      // console.log(nosupportReader,'nosupportReader');

      // const text1 = await resp.blob()
      // const reader = await resp.text()
      // console.log(resp, 'resp')
      // console.log(resp.body, 'resp.b')
      // console.log(reader, 'reader')
      const textDecoder = new TextDecoder();
      // console.log(textDecoder, 'textDecoder')

      // typeof TextDecoderStream !== 'undefined'
      // if (false) {
      //   reader = resp.body?.pipeThrough(new TextDecoderStream()).pipeThrough(TransformUtils.splitStream('\n')).getReader()
      // }
      // else {
      //   const readerInstance = resp.body?.getReader()
      //   const textDecoder = new TextDecoder('utf-8')
      //   reader = processStream(readerInstance, textDecoder)
      // }
      let buffer = "";

      while (1) {
        // let filterParseData = []
        // let decodeDataSplitList = []
        let done;
        if (nosupportReader) {
          const { done: readerDone, value } = await reader.read();
          done = readerDone;

          if (!value) {
            content.value = "";
            chatMessageList.value[chatMessageList.value.length - 1].loading =
              false;
            break;
          }

          // const decodeData = textDecoder?.decode(value, { stream: true })
          buffer += textDecoder?.decode(value, { stream: true });
          // console.log(buffer,'buffer111111');

          // decodeDataSplitList = decodeData.split('\n').filter(item => item)
        } else if (!window.ReadableStream || !resp.body?.getReader) {
          buffer += await resp.text();
          const lines = buffer.split("\n");
          // console.log(lines,'lines');

          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.trim()) {
              const data = parseJsonLikeData(line);
              // console.log(data, 'data')
              if (data && !data.done) {
                const lastChatItem =
                  chatMessageList.value[chatMessageList.value.length - 1];
                if (lastChatItem.id) {
                  const newData = parseMergeObj(lastChatItem, data);
                  // console.log(newData, 'newData')
                  if (newData.choices?.[0]) {
                    newData.choices = newData.choices.map((item) => {
                      const str = item.delta.content || "";
                      const thinkStr = item.delta.reasoning_content || "";
                      console.log(thinkStr, "thinkStr");

                      // const thinkStart = str.indexOf('<think>')
                      // const thinkEnd = str.indexOf('</think>')
                      // const strList = (thinkStart >= 0 ? str.substring(thinkStart + 7, thinkEnd >= 0 ? thinkEnd : str.length) : '').split('\n')
                      // const thinkStart = str.indexOf('<think>')
                      // const thinkEnd = str.indexOf('</think>')
                      // // console.log(thinkStart, thinkEnd, 'thinkStart, thinkEnd',str)
                      // const strList = (
                      //   thinkStart >= 0
                      //     ? str.substring(thinkStart + 7, thinkEnd >= 0 ? thinkEnd : str.length)
                      //     : thinkEnd >= 0
                      //       ? str.substring(0, thinkEnd)
                      //       : ''
                      // ).split('\n')
                      // if (thinkEnd >= 0) {
                      //   chatMessageList.value[chatMessageList.value.length - 1].thinkTime = (new Date().getTime() - startTime) / 1000
                      // }
                      // if (thinkStr) {

                      // }
                      // console.log(strList, 'strList',str.substring(thinkEnd + 8, str.length))
                      return {
                        ...item,
                        _thinkContent: thinkStr.split("\n"),
                        _content: str,
                      };
                    });
                  }
                  await new Promise((resolve) =>
                    setTimeout(resolve, Math.floor(Math.random() * 30))
                  );
                  chatMessageList.value[chatMessageList.value.length - 1] =
                    generatorAiChatList(newData);
                } else {
                  chatMessageList.value[chatMessageList.value.length - 1] =
                    generatorAiChatList({ ...data, docs });
                }
                scrollToBottom();
              }
            }
          }
          done = true;
        } else {
          buffer += await resp.text();
          // decodeDataSplitList = data.split('\n').filter(item => item)
          done = true;
        }

        if (done) {
          chatMessageList.value[chatMessageList.value.length - 1].loading =
            false;
          chatMessageList.value[chatMessageList.value.length - 1].pauseing =
            true;
          break;
        }

        // buffer += textDecoder.decode(value, { stream: true })

        const lines = buffer.split("\n");
        // console.log(lines,'lines');

        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            const data = parseJsonLikeData(line);
            // console.log(data, 'data')
            if (data && !data.done) {
              const lastChatItem =
                chatMessageList.value[chatMessageList.value.length - 1];
              if (lastChatItem.id) {
                const newData = parseMergeObj(lastChatItem, data);
                // console.log(newData, 'newData')
                if (newData.choices?.[0]) {
                  newData.choices = newData.choices.map((item) => {
                    const str = item.delta.content || "";
                    const thinkStr = item.delta.reasoning_content || "";

                    // const thinkStart = str.indexOf('<think>')
                    // const thinkEnd = str.indexOf('</think>')
                    // const strList = (thinkStart >= 0 ? str.substring(thinkStart + 7, thinkEnd >= 0 ? thinkEnd : str.length) : '').split('\n')
                    // const thinkStart = str.indexOf('<think>')
                    // const thinkEnd = str.indexOf('</think>')
                    // // console.log(thinkStart, thinkEnd, 'thinkStart, thinkEnd',str)
                    // const strList = (
                    //   thinkStart >= 0
                    //     ? str.substring(thinkStart + 7, thinkEnd >= 0 ? thinkEnd : str.length)
                    //     : thinkEnd >= 0
                    //       ? str.substring(0, thinkEnd)
                    //       : ''
                    // ).split('\n')
                    if (str) {
                      chatMessageList.value[
                        chatMessageList.value.length - 1
                      ].thinkTime = (new Date().getTime() - startTime) / 1000;
                    }
                    // console.log(strList, 'strList',str.substring(thinkEnd + 8, str.length))
                    return {
                      ...item,
                      _thinkContent: thinkStr.split("\n"),
                      _content: str,
                    };
                  });
                }
                await new Promise((resolve) =>
                  setTimeout(resolve, Math.floor(Math.random() * 30))
                );
                chatMessageList.value[chatMessageList.value.length - 1] =
                  generatorAiChatList(newData);
              } else {
                chatMessageList.value[chatMessageList.value.length - 1] =
                  generatorAiChatList({ ...data, docs });
              }
              scrollToBottom();
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.warn("请求已被中止");
      } else {
        messageApi.error(error.message || "请求失败");
      }
    } finally {
      loading.value = false;
      pauseing.value = true;
      const lastMessage =
        chatMessageList.value[chatMessageList.value.length - 1];
      lastMessage.loading = false;
      lastMessage.pauseing = true;
      lastMessage.thinkTime = (new Date().getTime() - startTime) / 1000;
      saveChatRecord();
    }
  }
}

async function saveChatRecord() {
  // 只有一条数据表示首次 不需要保存聊天记录
  if (chatMessageList.value.length === 1) return;

  try {
    const content = chatMessageList.value[chatMessageList.value.length - 1];
    await saveChatRecordService({
      conversationId: chatId.value,
      role: content.role,
      content: JSON.stringify(content),
      title: chatTitle.value,
    });
  } catch (message: any) {
    $message.error(message);
  }
}

function generatorMyChatList(content: string) {
  return {
    content,
    role: AI_IDENTITY_USER_VALUE,
    id: +new Date().getTime(),
    type: "my",
    tools: ["copy", "edit"],
  };
}

function generatorAiChatList(data: any) {
  return {
    // data: data?.choices || [],
    choices: data?.choices || [],
    role: AI_IDENTITY_AI_VALUE,
    id: data?.id,
    type: "robot",
    loading: true,
    pauseing: false,
    isSpread: true,
    thinkTime: null,
    isThink: isThink.value,
    isRepository: isRepository.value,
    tools: ["copy"],
    docs: data?.docs,
  };
}

function handlePackToolsToList(list: any[]) {
  return list.map((item) => {
    const isUser = item.role === AI_IDENTITY_USER_VALUE;
    return isUser
      ? { ...item, tools: ["copy", "edit"] }
      : { ...item, tools: ["copy"] };
  });
}

function scrollToBottom() {
  if (chatContainer.value) {
    // chatContainer.value.scrollIntoView({ behavior: 'smooth', block: 'end' })
    // setTimeout(() => {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    chatContainer.value.scrollTo(0, chatContainer.value.scrollHeight);
    // }, 1200)
  }
}

function handlePause() {
  if (controller.value.signal.aborted) {
    return;
  }
  controller.value.abort(); // 中止请求
  pauseing.value = true;
  loading.value = false;
  chatMessageList.value[chatMessageList.value.length - 1].loading = false;
  chatMessageList.value[chatMessageList.value.length - 1].pauseing = true;
}

// 获取会话详情
async function getChatDetail() {
  spinning.value = true;
  try {
    const data: {
      list: Array<any>;
      title: string;
    } = (await getChatDetailService({ conversationId: chatId.value })) as any;
    // console.log(data, 'data')
    const isSendChat =
      data.list[data.list.length - 1]?.role === AI_IDENTITY_USER_VALUE;

    chatMessageList.value = data.list.map((item) => JSON.parse(item.content));
    // console.log(chatMessageList.value, 'chatMessageList.value111111')
    chatMessageList.value = handlePackToolsToList(chatMessageList.value);
    // console.log(chatMessageList.value, 'chatMessageList.value222222')
    chatTitle.value = data.title;

    if (isSendChat) {
      const lastData = chatMessageList.value.splice(
        chatMessageList.value.length - 1,
        1
      );
      content.value = lastData?.[0].content;
      chatTitle.value = lastData?.[0].content?.substring(0, 32) || data.title;
      handleUpdateTitle();
      sendChat();
    }
    nextTick(() => {
      scrollToBottom();
    });
  } catch (message: any) {
    $message.error(message);
  } finally {
    spinning.value = false;
  }
}

async function handleUpdateTitle() {
  if (!chatTitle.value) {
    chatTitle.value = oldChatTitle.value as string;
    return;
  }

  try {
    await reChatNameService({
      conversationId: chatId.value as string,
      newTitle: chatTitle.value,
    });
    userStore.getChatList();
  } catch (message: any) {
    $message.error(message);
  }
}

const titleInput = ref(null);

function adjustInputWidth() {
  nextTick(() => {
    const input = (titleInput.value as unknown as HTMLElement)?.querySelector(
      "input"
    );
    if (!input) return;

    const span = document.createElement("span");
    span.style.visibility = "hidden";
    span.style.position = "absolute";
    span.style.whiteSpace = "pre";
    span.style.font = window.getComputedStyle(input).font;
    span.textContent = chatTitle.value || "请输入标签";

    document.body.appendChild(span);
    const width = span.offsetWidth;
    document.body.removeChild(span);

    // 设置input宽度，加上一些padding
    input.style.width = `${Math.min(Math.max(width + 32, 60), 480)}px`;
  });
}

function handleToolsCopy(content) {
  const textArea = document.createElement("textarea");
  textArea.value = content.replace(/\n\n/g, "");
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

function handleVisibleResult(data: any) {
  visibleSearchResult.value = true;
  searchResultData.value = data?.docs || [];
}

onMounted(() => {
  adjustInputWidth();
});

watch(chatTitle, () => {
  adjustInputWidth();
});
</script>

<template>
  <div class="flex flex-col overflow-hidden">
    <div class="m-auto h-screen w-full flex flex-col">
      <!-- 标题 -->
      <div class="relative inline-block w-full self-center justify-center p-t-24">
        <div v-show="chatTitle || oldChatTitle" ref="titleInput" class="chat-title m-auto m-auto flex cursor-pointer overflow-hidden text-ellipsis rounded-12 p-x-12 p-y-8 text-center text-center text-nowrap text-16 font-600 tracking-widest">
          <AInput v-model:value="chatTitle" type="text" class="m-auto !min-w-200 border-0 text-center" size="large" placeholder="请输入标签" :maxlength="32" @focus="oldChatTitle = chatTitle" @blur="handleUpdateTitle" @input="adjustInputWidth" />
        </div>
        <div class="absolute bottom-0 z-1 h-32 w-full translate-y-[100%] from-[rgb(255,255,255)] bg-gradient-to-b opacity-70" />
      </div>

      <!-- 聊天框 -->
      <div ref="chatContainer" class="w-full flex-1 overflow-y-auto p-b-40 p-t-42">
        <ASpin :spinning="spinning">
          <div class="m-auto w-[var(--content-max-width)]">
            <template v-for="(item, index) in chatMessageList">
              <div v-if="item.type === 'my'" :key="index" class="group my m-b-16 flex justify-end whitespace-pre-wrap break-all p-b-32">
                <div class="mr-12 opacity-0 transition-all duration-800 group-hover:block group-hover:opacity-100">
                  <Tools v-model="item.tools" @copy="handleToolsCopy(item.content)" @edit="content = item.content" />
                </div>
                <div class="rounded-14 bg-[var(--chat-my-bg)] p-x-20 p-y-12 text-16 lh-2em">
                  {{ item.content }}
                </div>
              </div>
              <div v-else :key="item.id" :class="[index + 1 === chatMessageList.length && loading ? 'm-b-0 p-b-0' : ' m-b-16 p-b-32']" class="robot flex items-start justify-start">
                <div class="m-r-16 border-width-1 border-color-#d5e4ff rounded-50% border-style-solid p-2">
                  <img class="h-28 w-28" src="@/assets/images/logo.svg">
                </div>
                <div class="group">
                  <template v-for="(cur, i) in item.choices" :key="cur.id">
                    <div>
                      <div v-if="item.isRepository">
                        <div :key="i" class="think m-b-12 flex-inline cursor-pointer items-center rounded-10 bg-[var(--chat-robot-bg)] p-x-12 p-y-8 lh-18 hover:bg-[var(--chat-robot-hover)]" @click="handleVisibleResult(item)">
                          <SearchOutlined class="m-r-6 h-12 w-12" />
                          <div class="text-12 text-[var(--text-color)]">
                            已搜索到 <b>{{ item.docs?.length || 0 }}</b> 个关联知识库
                          </div>
                          <RightOutlined class="m-l-12 h-10 w-10 text-10" />
                        </div>
                      </div>

                      <div v-if="item.isThink">
                        <div :key="i" class="think m-b-12 flex-inline cursor-pointer items-center rounded-10 bg-[var(--chat-robot-bg)] p-x-12 p-y-8 lh-18 hover:bg-[var(--chat-robot-hover)]" @click="item.isSpread = !item.isSpread">
                          <img class="m-r-6 h-12 w-12" src="@/assets/images/think_icon.svg">
                          <div class="text-12 text-[var(--text-color)]">
                            {{ item.loading ? '正在思考中...' : `已深度思考（用时${item.thinkTime}s）` }}
                          </div>
                          <UpOutlined v-if="item.isSpread" class="m-l-12 h-10 w-10 text-10" @click="item.isSpread = false" />
                          <DownOutlined v-else class="m-l-12 h-10 w-10 text-10" @click="item.isSpread = true" />
                        </div>

                        <div v-if="item.isSpread" :key="i" class="think-content m-b-14 whitespace-pre-wrap break-all border-l-width-2 border-l-color-[var(--chat-think-border)] border-l-style-solid p-l-12">
                          <p v-for="(_item, _i) in cur._thinkContent" :key="_i" class="m-y-1em text-14 text-[var(--chat-think-text)] lh-1.6em">
                            {{ _item }}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div class="no-think whitespace-normal lh-2em">
                      <!-- {{ cur._content }} -->
                      <MdPreview class="p-0" :model-value="cur._content"  :auto-fold-threshold="999999" />
                    </div>
                  </template>
                  <LoadingOutlined v-if="item.loading" class="m-b-24 m-t-6 cursor-not-allowed text-26 text-#909090" />
                  <div v-if="!item.loading" class="mr-12 opacity-0 transition-all duration-800 group-hover:block group-hover:opacity-100">
                    <Tools v-model="item.tools" @click="handleToolsCopy(item?.choices[0]?._content)" />
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div v-if="chatMessageList.length && !loading" class="text-center">
            <div class="h-32 flex-inline cursor-pointer items-center rounded-14 bg-[var(--primary-bg-color)] p-x-10 text-center transition-all duration-600 hover:bg-[var(--button-hover)]" @click="router.push('/chat')">
              <img class="m-r-10 h-18 w-18" src="@/assets/images/add_new_icon.svg">
              <div class="text-14 color-[var(--primary-color)]">
                开启新对话
              </div>
            </div>
          </div>
        </ASpin>
      </div>

      <!-- 发送框 -->
      <div>
        <div class="m-auto w-[var(--content-max-width)] flex flex-col items-start overflow-hidden rounded-24 bg-[var(--label-bg-color)] p-10 shadow-inner">
          <ATextarea v-model:value="content" placeholder="给 土猪  发送消息" autofocus :autoSize="{ minRows: 2, maxRows: 10 }" class="max-w-full! min-w-full! w-full! resize-none! border-0! bg-transparent! text-16! focus:border-0! hover:border-0! focus:shadow-none!" @keydown.enter.prevent="handleEnterSendChat" />
          <div class="mt-10 w-full flex items-center justify-between">
            <div class="flex items-center justify-start">
              <ATooltip :key="Math.random()" placement="left">
                <template v-if="!isThink" #title>
                  <span class="text-12">调用新模型 Deepseek-R1，解决推理问题</span>
                </template>
                <div :class="[isThink ? 'bg-[var(--button-hover)] text-[var(--primary-color)] border-color-[var(--button-hover)]' : '']" class="h-28 flex cursor-pointer items-center justify-between border-width-1 border-color-[rgba(0,0,0,.12)] rounded-14 border-solid p-x-8 transition-all duration-300 hover:bg-[var(--button-hover-2)]" @click="isThink = !isThink">
                  <img v-if="!isThink" src="@/assets/images/think_icon.svg" class="m-r-4 h-18 w-18 cursor-pointer">
                  <img v-else src="@/assets/images/think_active_icon.svg" class="m-r-4 h-18 w-18 cursor-pointer">
                  <div class="pt-2 vertical-middle text-12">
                    深度思考(R1)
                  </div>
                </div>
              </ATooltip>
              <!-- <ATooltip placement="right">
                <template v-if="!isRepository" #title>
                  <span class="text-12">关联知识库搜索</span>
                </template>
                <div
                  :class="[isRepository ? 'bg-[var(--button-hover)] text-[var(--primary-color)] border-color-[var(--button-hover)]' : '']"
                  class="ml-12 h-28 flex cursor-pointer items-center justify-between border-width-1 border-color-[rgba(0,0,0,.12)] rounded-14 border-solid p-x-8 transition-all duration-300 hover:bg-[var(--button-hover-2)]"
                  @click="isRepository = !isRepository"
                >
                  <GlobalOutlined class="m-r-4 cursor-pointer vertical-middle text-18" />
                  <div class="pt-2 vertical-middle text-12">
                    知识库搜索
                  </div>
                </div>
              </ATooltip> -->
            </div>

            <div>
              <div>
                <ATooltip placement="top">
                  <template v-if="!content" #title>
                    <span>{{ !pauseing ? '停止生成' : '请输入你的问题' }}</span>
                  </template>
                  <div :class="[content || !pauseing ? 'cursor-pointer bg-[var(--primary-color)] hover:opacity-80 transition-all duration-300' : 'cursor-not-allowed bg-[rgb(214,222,232)]']" class="h-32 w-32 flex items-center justify-center rounded-50%" @click="sendChat">
                    <ArrowUpOutlined v-if="!loading" class="text-#fafafa" />
                    <PauseOutlined v-else-if="!pauseing" class="text-#fafafa" @click="handlePause" />
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

    <SearchResult v-model:visible="visibleSearchResult" :data="searchResultData" />
    <contextHolder />
  </div>
</template>

<style lang='scss' scoped>
:deep(.md-editor-preview-wrapper) {
  padding: 0;
}

.chat-title {
  // min-width: 120px;
  // max-width: 360px;
  margin: auto;

  :deep(.ant-input) {
    transition: width 0.2s;
    border-color: transparent;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    margin: auto;

    &:hover {
      border-color: #4096ff;
    }

    &:focus {
      border-color: #4096ff;
    }
  }
}
</style>

<route lang="yaml">
name: chat-detail
meta:
  layout: default
  requiresAuth: true
</route>
