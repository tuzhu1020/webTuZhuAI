<script setup lang='ts'>
import { IS_PROD } from "@/config";
import { AI_IDENTITY_AI_VALUE, AI_IDENTITY_USER_VALUE } from "@/constant/enum";

import getChatDetailService from "@/service/chat/getChatDetailService";
import getSearchKnowledgeService from "@/service/chat/getSearchKnowledgeService";
import { SEND_USER_MESSAGE_SERVICE } from "@/service/chat/index";
import reChatNameService from "@/service/chat/reChatNameService";
import saveChatRecordService from "@/service/chat/saveChatRecordService";

import { useUserStore } from "@/stores/user";
import { useChatStore } from "@/stores/chat";

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
const chatMessageList = ref<Array<any>>([]);
const chatContainer = ref(null);
const controller = ref<any>(null);
const loading = ref<boolean>(false);
const spinning = ref<boolean>(false);
const chatTitle = ref<string>("");
const oldChatTitle = ref<string>();
const userStore = useUserStore();
const chatStore = useChatStore();
const visibleSearchResult = ref<boolean>(false);
const searchResultData = ref<any[]>([]);
const sessionProcessInterval = ref<number | null>(null);

const chatId = computed(() => route.params?.id as string);

watch(
  () => route.query,
  async (query) => {
    isThink.value = query.isThink === "true";
    isRepository.value = query.isRepository === "true";
  },
  {
    immediate: true,
    deep: true,
  }
);

watch(
  chatId,
  (newChatId, oldChatId) => {
    // 设置当前活跃会话
    if (newChatId) {
      console.log(`切换到会话 ${newChatId}，之前的会话是 ${oldChatId}`);
      chatStore.setActiveSession(newChatId);

      // 处理旧会话中的AI输出
      if (oldChatId) {
        // 旧会话正在处理中，我们不中断它，只是切换视图
        const oldSession = chatStore.getSessionStatus(oldChatId);
        if (oldSession && !oldSession.isDone && !oldSession.isPaused) {
          console.log(`会话 ${oldChatId} 仍在处理中，不中断，保留其状态`);
        }
      }

      // 获取新会话详情
      getChatDetail();
    }
  },
  { immediate: true }
);

// 当组件加载时，开始处理当前会话的数据
onMounted(() => {
  console.log("组件挂载，设置定时器");
  // 设置一个间隔来定期检查和处理当前会话的数据
  if (!sessionProcessInterval.value) {
    console.log("创建新的定时器来处理会话数据");
    sessionProcessInterval.value = window.setInterval(() => {
      const currentChatId = chatId.value;
      if (currentChatId) {
        const session = chatStore.getSessionStatus(currentChatId);
        if (
          session &&
          !session.isPaused &&
          !session.isDone &&
          !session.isProcessing
        ) {
          console.log("处理会话数据:", currentChatId);
          chatStore
            .processChatSession(currentChatId, chatMessageList.value)
            .then((isDone) => {
              if (isDone) {
                console.log("会话处理完成，保存记录");
                // 会话完成，保存记录
                saveChatRecord();
              } else {
                // 会话继续，滚动到底部
                scrollToBottom();
              }
            })
            .catch((error) => {
              console.error("处理会话数据失败:", error);
            });
        }
      }
    }, 30); // 减少到30ms以提高响应速度
  }
});

// 当组件卸载时，清理间隔
onUnmounted(() => {
  if (sessionProcessInterval.value) {
    clearInterval(sessionProcessInterval.value);
    sessionProcessInterval.value = null;
  }
});

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
    console.log("发送消息:", content.value);
    loading.value = true;

    // 添加用户消息
    chatMessageList.value.push(generatorMyChatList(content.value));

    // 添加AI回复占位
    chatMessageList.value.push(generatorAiChatList({}));
    scrollToBottom();

    // 保存用户消息
    // await saveChatRecord();

    try {
      // 处理知识库搜索
      let docs = null;
      if (isRepository.value) {
        console.log("获取知识库搜索结果");
        const data = await getSearchKnowledgeService({
          query: content.value,
        });
        docs = data || [];
      }

      // 清空输入框
      const userMessage = content.value;
      content.value = "";

      // 准备消息列表
      const messages = chatMessageList.value
        .map((item) => {
          const isUser = item.role === "user";
          return {
            role: isUser ? item.role : "assistant",
            content: isUser ? item.content : item.choices?.[0]?.delta.content,
          };
        })
        .filter((item) => item.content);

      console.log("准备发送的消息:", messages);

      // 使用chat store启动会话
      const model = isThink.value ? "deepseek-reasoner" : "deepseek-chat";
      pauseing.value = false;

      console.log("开始新的AI会话，模型:", model);
      await chatStore.startChatSession(
        chatId.value,
        messages,
        userStore,
        model,
        docs
      );

      // 确保定时器正在运行，处理后续的响应
      if (!sessionProcessInterval.value) {
        console.log("创建新的定时器来处理会话响应");
        sessionProcessInterval.value = window.setInterval(() => {
          const currentChatId = chatId.value;
          if (currentChatId) {
            const session = chatStore.getSessionStatus(currentChatId);
            if (
              session &&
              !session.isPaused &&
              !session.isDone &&
              !session.isProcessing
            ) {
              console.log("处理会话响应数据:", currentChatId);
              chatStore
                .processChatSession(currentChatId, chatMessageList.value)
                .then((isDone) => {
                  if (isDone) {
                    console.log("会话响应处理完成，保存记录");
                    // 会话完成，保存记录
                    saveChatRecord();
                  } else {
                    // 会话继续，滚动到底部
                    scrollToBottom();
                  }
                })
                .catch((error) => {
                  console.error("处理会话响应数据失败:", error);
                });
            }
          }
        }, 30); // 减少到30ms以提高响应速度
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.warn("请求已被中止");
      } else {
        console.error("发送消息失败:", error);
        messageApi.error(error.message || "请求失败");
      }
    } finally {
      loading.value = false;
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
    choices: data?.choices || [],
    role: AI_IDENTITY_AI_VALUE,
    id: data?.id || +new Date().getTime(),
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
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    chatContainer.value.scrollTo(0, chatContainer.value.scrollHeight);
  }
}

function handlePause() {
  // 使用chat store暂停会话
  chatStore.pauseSession(chatId.value);
  pauseing.value = true;
  loading.value = false;

  // 更新UI状态
  const lastMessage = chatMessageList.value[chatMessageList.value.length - 1];
  if (lastMessage) {
    lastMessage.loading = false;
    lastMessage.pauseing = true;
  }
}

// 获取会话详情
async function getChatDetail() {
  spinning.value = true;
  try {
    const data: {
      list: Array<any>;
      title: string;
    } = (await getChatDetailService({ conversationId: chatId.value })) as any;

    const isSendChat =
      data.list[data.list.length - 1]?.role === AI_IDENTITY_USER_VALUE;

    // 获取当前会话的状态
    const session = chatStore.getSessionStatus(chatId.value);

    // 从服务器获取消息列表并解析
    let serverMessages = data.list.map((item) => JSON.parse(item.content));
    serverMessages = handlePackToolsToList(serverMessages);

    // 检查是否有未完成的会话和缓存的AI回复
    if (session && session.lastChatItem && !session.isDone) {
      console.log("发现未完成的会话和缓存的AI回复，合并数据...");

      // 找到最后一条AI消息在服务器消息中的位置
      const lastAiMsgIndex = serverMessages.findIndex(
        (msg) =>
          msg.role === AI_IDENTITY_AI_VALUE &&
          msg.id === session.lastChatItem.id
      );

      if (lastAiMsgIndex !== -1) {
        // 用会话中缓存的消息替换服务器返回的最后一条AI消息
        console.log("使用会话中缓存的AI回复替换服务器消息");
        serverMessages[lastAiMsgIndex] = session.lastChatItem;
      } else if (
        serverMessages.length > 0 &&
        serverMessages[serverMessages.length - 1].role === AI_IDENTITY_AI_VALUE
      ) {
        // 如果找不到匹配ID但最后一条是AI消息，仍然替换
        console.log("最后一条消息是AI消息，使用会话缓存替换");
        serverMessages[serverMessages.length - 1] = session.lastChatItem;
      }
    }

    // 更新界面显示的消息列表
    chatMessageList.value = serverMessages;
    chatTitle.value = data.title;

    // 检查会话状态，决定下一步操作
    if (session && !session.isDone && !session.isPaused) {
      // 会话正在进行中，不重新发送
      console.log("会话正在进行中，继续处理...");
      // 确保AI消息状态正确
      if (chatMessageList.value.length > 0) {
        const lastMsg = chatMessageList.value[chatMessageList.value.length - 1];
        if (lastMsg.role === AI_IDENTITY_AI_VALUE) {
          lastMsg.loading = true;
          lastMsg.pauseing = false;
        }
      }
    } else if (isSendChat) {
      // 需要发送一个新的消息
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
  // 创建临时文本区域
  const textArea = document.createElement("textarea");

  // 如果内容包含markdown格式特征，尝试移除markdown格式
  const strippedContent = content
    .replace(/\n\n/g, "\n")
    .replace(/#{1,6}\s+/g, "") // 移除标题格式
    .replace(/\*\*(.*?)\*\*/g, "$1") // 移除粗体
    .replace(/\*(.*?)\*/g, "$1") // 移除斜体
    .replace(/`{3}[\s\S]*?`{3}/g, (match) => {
      // 处理代码块
      return match
        .replace(/^```[\w]*\n/, "") // 移除开头的 ```语言
        .replace(/```$/, ""); // 移除结尾的 ```
    })
    .replace(/`(.*?)`/g, "$1") // 移除行内代码
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1") // 将链接格式替换为纯文本
    .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, "") // 移除图片引用
    .replace(/>\s+(.*)/g, "$1") // 移除引用块
    .replace(/- /g, "• ") // 将列表项转换为普通文本
    .replace(/\d+\.\s+/g, ""); // 移除有序列表数字

  textArea.value = strippedContent;
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
          <AInput :value="chatTitle" @update:value="chatTitle = $event" type="text" class="m-auto border-0 text-center" size="large" placeholder="请输入标签" :maxlength="32" @focus="oldChatTitle = chatTitle" @blur="handleUpdateTitle" @input="adjustInputWidth" />
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
                  <Tools :options="item.tools" @copy="handleToolsCopy(item.content)" @edit="content = item.content" />
                </div>
                <div class="rounded-14 bg-[var(--chat-my-bg)] p-x-20 p-y-12 text-16 lh-2em">
                  {{ item.content }}
                </div>
              </div>
              <div v-else :key="item.id" :class="[index + 1 === chatMessageList.length && loading ? 'm-b-0 p-b-0' : ' m-b-16 p-b-32']" class="robot flex items-start justify-start w-[var(--content-max-width)]">
                <div class="m-r-16 border-width-1 border-color-#d5e4ff rounded-50% border-style-solid p-2">
                  <img class="h-28 w-28" src="@/assets/images/logo.svg">
                </div>
                <div class="group">
                  <div v-for="(cur, i) in item.choices" :key="i">
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
                      <MdPreview class="p-0" :model-value="cur._content" />
                    </div>
                  </div>
                  <LoadingOutlined v-if="item.loading" class="m-b-24 m-t-6 cursor-not-allowed text-26 text-#909090" />
                  <div v-if="!item.loading" class="mr-12 opacity-0 transition-all duration-800 group-hover:block group-hover:opacity-100">
                    <Tools :options="item.tools" @copy="handleToolsCopy(item?.choices[0]?._content)" />
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
          <ATextarea :value="content" @update:value="content = $event" placeholder="给 DeepSeek 发送消息" autofocus :autoSize="{ minRows: 2, maxRows: 10 }" class="max-w-full! min-w-full! w-full! resize-none! border-0! bg-transparent! text-16! focus:border-0! hover:border-0! focus:shadow-none!" @keydown.enter.prevent="handleEnterSendChat" />
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

    <SearchResult :visible="visibleSearchResult" @update:visible="visibleSearchResult = $event" :data="searchResultData" />
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
