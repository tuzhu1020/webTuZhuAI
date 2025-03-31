<script setup lang="ts">
import { $message } from "@/composables/antMessage";
import { AI_IDENTITY_USER_VALUE } from "@/constant/enum";
import createNewChatService from "@/service/chat/createNewChatService";
import saveChatRecordService from "@/service/chat/saveChatRecordService";
import { useUserStore } from "@/stores/user";
import { ArrowUpOutlined, LoadingOutlined } from "@ant-design/icons-vue";
import { Textarea as ATextarea, Tooltip as ATooltip } from "ant-design-vue";

defineOptions({
  name: "Index",
});

const isThink = ref<boolean>(false);
const isRepository = ref<boolean>(false);
const content = ref<string>("");
const loading = ref<boolean>(false);
const router = useRouter();
const userStore = useUserStore();
const { getChatList } = userStore;

function generatorMyChatList(content: string) {
  return {
    content,
    role: "user",
    id: +new Date().getTime(),
    type: "my",
  };
}

function sendChatFn() {
  loading.value = true;
  setTimeout(async () => {
    // router.push({
    //   path: `/chat/${+new Date().getTime()}`,
    //   query: {
    //     isRepository: isRepository.value ? 'true' : '',
    //     isThink: isThink.value ? 'true' : '',
    //     content: content.value,
    //   },
    // })
    try {
      const { title, id } = await createNewChatService({ title: "新会话" });
      await saveChatRecordService({
        title,
        conversationId: id,
        content: JSON.stringify(generatorMyChatList(content.value)),
        role: AI_IDENTITY_USER_VALUE,
      });
      getChatList();
      router.push({
        path: `/chat/${id}`,
        query: {
          isRepository: isRepository.value ? "true" : "",
          isThink: isThink.value ? "true" : "",
        },
      });
    } catch (message: any) {
      $message.error(message);
    } finally {
      loading.value = false;
    }
  }, 1200);
}

function sendChat(event: any) {
  if (event.keyCode === 13) {
    if (!event.shiftKey) {
      event.preventDefault();

      if (content.value) sendChatFn();
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
  } else {
    if (content.value) sendChatFn();
  }
}
</script>

<template>
  <div class="m-auto max-w-800 p-x64">
    <div class="mt-46% flex items-center justify-center text-center text-24">
      <img class="mr-18 h-60 w-60" src="@/assets/images/logo.svg">
      <div>我是土猪，很高兴见到你！</div>
    </div>
    <div class="mb-32 mt-8 text-center text-14">
      我可以帮你写代码、读文件、写作各种创意内容，请把你的任务交给我吧~
    </div>
    <!-- 内容 -->
    <!-- 0px 0px 0px .5px var(--dsr-input-border) -->
    <div class="flex flex-col items-start overflow-hidden rounded-24 bg-[var(--label-bg-color)] p-10 shadow-inner">
      <ATextarea v-model:value="content" placeholder="给 DeepSeek 发送消息" autofocus :autoSize="{ minRows: 2, maxRows: 10 }" class="max-w-full! min-w-full! w-full! resize-none! border-0! bg-transparent! text-16! focus:border-0! hover:border-0! focus:shadow-none!" @keydown.enter.prevent="sendChat" />
      <div class="mt-10 w-full flex items-center justify-between">
        <div class="flex items-center justify-start">
          <ATooltip placement="left">
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
                <span>请输入你的问题</span>
              </template>
              <div :class="[content ? 'cursor-pointer bg-[var(--primary-color)] hover:opacity-80 transition-all duration-300' : 'cursor-not-allowed bg-[rgb(214,222,232)]']" class="h-32 w-32 flex items-center justify-center rounded-50%" @click="sendChat">
                <ArrowUpOutlined v-if="!loading" class="text-#fafafa" />
                <LoadingOutlined v-else class="cursor-not-allowed text-#fafafa" />
              </div>
            </ATooltip>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped></style>
<route lang="yaml">
name: chat
meta:
  layout: default
  requiresAuth: true
</route>