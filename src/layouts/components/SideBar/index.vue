<script setup lang='ts'>
import { $message } from "@/composables/antMessage";
import delAllChatService from "@/service/chat/delAllChatService";
import delChatService from "@/service/chat/delChatService";
import reChatNameService from "@/service/chat/reChatNameService";
import { useUserStore } from "@/stores/user";

import OperatorLog from "@/weights/System/OperatorLog/index.vue";
import {
  Dropdown as ADropdown,
  Input as AInput,
  Menu as AMenu,
  MenuItem as AMenuItem,
  Modal as AModal,
  Spin as ASpin,
  Tooltip as ATooltip,
} from "ant-design-vue";

defineOptions({
  name: "SideBar",
});

const router = useRouter();
const route = useRoute();
const isCollapse = ref<boolean>(true);
const userStore = useUserStore();
const { getChatList, userInfo, token } = userStore;
const isMobile = ref<boolean>(false);

// 检测屏幕尺寸
const checkIsMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

const sideChatList = ref<Array<any>>([]);
const loading = ref<boolean>(true);
const curChatId = ref<string>("");
const showOperatorLog = ref<boolean>(false);

const [modal, contextHolder] = AModal.useModal();

const hasLogPermission = computed(() => {
  return userStore?.userInfo?.isAdmin === 1;
});

function handleLogo(): void {
  // router.push('/')
  isCollapse.value = true;
}

function handleDel(id: string) {
  modal.confirm({
    title: "永久删除对话",
    content: "删除后，该对话将不可恢复。确认删除吗？",
    okText: "删除",
    okButtonProps: {
      type: "primary",
      danger: true,
      ghost: false,
    },
    cancelText: "取消",
    centered: true,
    cancelButtonProps: {
      type: "link",
    },
    mask: false,
    async onOk() {
      loading.value = true;
      try {
        await delChatService({ conversationId: id });
        getChatList();
        // 当前对话删除跳转到根目录
        if (curChatId.value === String(id)) {
          router.replace("/chat");
        }
        $message.success("删除成功");
      } catch (message) {
        $message.error(message);
      } finally {
        loading.value = false;
      }
    },
    onCancel() {},
  });
}

function handleClearChat() {
  modal.confirm({
    title: "删除所有历史对话",
    content:
      "如点击确认删除，当前账号的所有历史对话将被清空，无法找回。确认要删除所有历史对话吗？",
    okText: "确认删除",
    okButtonProps: {
      type: "primary",
      danger: true,
      ghost: false,
    },
    cancelText: "取消",
    centered: true,
    cancelButtonProps: {
      type: "link",
    },
    mask: false,
    async onOk() {
      loading.value = true;
      try {
        await delAllChatService();
        getChatList();
        // 使用 replace 并添加 replace: true 选项防止重定向
        router.replace({
          path: "/chat",
          replace: true,
        });
        $message.success("删除成功");
      } catch (message) {
        $message.error(message);
      } finally {
        loading.value = false;
      }
    },
    onCancel() {},
  });
}

function handleShowEdit(id: string) {
  sideChatList.value.forEach((item) => {
    item.list.forEach((cur) => {
      if (cur.id === id) {
        cur._isEdit = true;
        nextTick(() => {
          const ele = document.getElementById(
            cur._refContent
          ) as HTMLInputElement;
          ele.focus();
        });
      }
    });
  });
}

async function handleUpdateTitle(cur: any) {
  cur._isEdit = false;

  if (cur.title === cur._originTitle) {
    return;
  }

  if (!cur.title) {
    // cur.title = cur.originTitle as string
    sideChatList.value.forEach((item) => {
      item.list = item.list.map((childItem: any) => {
        if (cur._id === childItem._id) {
          childItem.title = childItem._originTitle;
        }
        return childItem;
      });
    });
    return;
  }

  try {
    await reChatNameService({
      conversationId: cur.id,
      newTitle: cur.title,
    });
    userStore.getChatList();
  } catch (message: any) {
    $message.error(message);
  }
}

watch(
  () => userStore.chatList,
  (newVal) => {
    sideChatList.value = [...newVal];
    sideChatList.value = sideChatList.value.map((item) => {
      item.list = item.list.map((cur) => {
        cur._isEdit = false;
        cur._originTitle = cur.title;
        cur._refContent = `refContent_${cur.id}`;
        return cur;
      });
      return item;
    });

    loading.value = false;
  },
  { immediate: true }
);

watch(
  () => route.params,
  (newVal) => {
    // if (newVal?.id) {
    //   getChatList()
    // }
    curChatId.value = newVal?.id;
  },
  {
    immediate: true,
  }
);

onMounted(() => {
  token && getChatList();
  checkIsMobile();
  window.addEventListener('resize', checkIsMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile);
});
</script>

<template>
  <div>
    <!-- 展开 -->
    <div v-if="isCollapse" :class="['h-screen flex flex-col bg-[var(--sidebar-bg)]', isMobile ? 'w-full' : 'w-[var(--sidebar-width)]']">
      <!-- header -->
      <div class="flex items-center justify-between p-b-24 md:p-b-34 p-l-16 md:p-l-20 p-r-8 md:p-r-10 p-t-20 md:p-t-25">
        <img class="h-22 md:h-26 cursor-pointer" src="@/assets/images/logo_text.svg" @click="router.push('/')">
        <ATooltip v-if="!isMobile" title="收起边栏" placement="bottom">
          <div class="cursor-pointer rounded-4 p-2 transition-all duration-300 hover:bg-[rgb(241,245,249)]" @click="isCollapse = !isCollapse">
            <img class="h-24 md:h-28 w-24 md:w-28" src="@/assets/images/collapse_icon.svg">
          </div>
        </ATooltip>
      </div>
      <!-- 开启新对话 -->
      <div class="mb-24 md:mb-34 px-12 md:px-0">
        <div class="ml-0 md:ml-14 h-44 md:h-44 flex-inline cursor-pointer items-center rounded-14 bg-[var(--primary-bg-color)] p-x-12 md:p-x-10 p-y-10 md:p-y-0 transition-all duration-600 hover:bg-[var(--button-hover)] active:scale-95" @click="router.push('/chat')">
          <img class="m-r-8 md:m-r-10 h-20 md:h-22 w-20 md:w-22" src="@/assets/images/add_new_icon.svg">
          <div class="color-[var(--primary-color)] text-14 md:text-16 font-medium">
            开启新对话
          </div>
        </div>
      </div>
      <!-- content -->
      <ASpin wrapper-class-name="a-spin-box" class="h-full" :spinning="loading">
        <!-- 暂无数据 -->
        <div v-if="isCollapse && !sideChatList.length" class="flex flex-1 items-center justify-center text-13 md:text-14 color-[var(--label-color)]">
          <div>暂无历史对话</div>
        </div>
        <!-- 有数据 -->
        <div v-if="sideChatList.length" class="flex-1">
          <div v-for="(item, index) in sideChatList" :key="index" class="mb-20 md:mb-24 px-8 md:px-10">
            <div class="mb-5 md:mb-6 px-8 md:px-10 pb-8 md:pb-10 text-12 md:text-13 text-#555 font-600 sticky top-0 z-10 bg-[var(--sidebar-bg)]">
              {{ item.timeStr }}
            </div>
            <div v-for="cur in item.list" :key="cur.id" class="group relative box-border min-h-40 md:h-38 w-full cursor-pointer overflow-hidden rounded-12 px-10 md:px-10 py-10 md:py-0 transition-all duration-300 hover:bg-[var(--sidebar-hover)] active:scale-98" :class="curChatId === String(cur.id) ? 'bg-[var(--primary-bg-color)]' : ''" @click="router.push({ path: `/chat/${cur.id}` })">
              <div class="whitespace-nowp overflow-hidden p-r-32 md:p-r-12 text-14 md:text-15 text-[var(--text-color)] lh-40 md:lh-38">
                <ATooltip v-if="!cur._isEdit" placement="top">
                  {{ cur.title }}
                </ATooltip>
                <AInput v-if="cur._isEdit" :id="cur._refContent" v-model:value="cur.title" type="text" placeholder="请输入标签" :maxlength="32" :size="isMobile ? 'middle' : 'large'" @blur="handleUpdateTitle(cur)" />
              </div>
              <div v-if="!cur._isEdit" :class="['absolute top-50% z-2 translate-y-[-50%] rounded-12 p-1 md:p-4', isMobile ? 'right-8 block' : 'right-12 hidden group-hover:block hover:bg-white']">
                <ADropdown :trigger="['click']">
                  <img class="h-18 md:h-16 w-18 md:w-16" src="@/assets/images/more_icon.svg" @click.stop="() => {}">
                  <template #overlay>
                    <AMenu>
                      <AMenuItem>
                        <div class="flex items-center py-10 md:py-8 px-8 md:px-4" @click="handleShowEdit(cur.id)">
                          <img src="@/assets/images/edit_icon.svg" class="h-20 md:h-24 w-20 md:w-24">
                          <div class="mx-8 md:mx-10 text-14 md:text-15">
                            重命名
                          </div>
                        </div>
                      </AMenuItem>
                      <AMenuItem>
                        <div class="flex items-center py-10 md:py-8 px-8 md:px-4" @click="handleDel(cur.id)">
                          <img src="@/assets/images/del_red_icon.svg" class="h-20 md:h-24 w-20 md:w-24">
                          <div class="mx-8 md:mx-10 text-14 md:text-15 color-[var(--danger-color)]">
                            删除
                          </div>
                        </div>
                      </AMenuItem>
                    </AMenu>
                  </template>
                </ADropdown>
              </div>
              <div v-if="!cur._isEdit && !isMobile" class="absolute right-0 top-0 z-1 h-full w-84 from-[rgb(249,251,255)] bg-gradient-to-l" />
            </div>
          </div>
        </div>
      </ASpin>
      <!-- 个人信息 -->
      <div>
        <div class="p-x-10 md:p-x-12 p-y-8 md:p-y-10">
          <ADropdown placement="top" :trigger="['click']">
            <div class="flex cursor-pointer items-center justify-start rounded-12 p-10 md:p-8 transition-all duration-300 hover:bg-[var(--sidebar-hover)] active:scale-98">
              <img src="@/assets/images/default_avatar.svg" class="h-36 md:h-32 w-36 md:w-32 rounded-full">
              <div class="ml-12 md:ml-14 text-14 md:text-14 color-[rgb(82,82,82)] font-medium">
                个人信息
              </div>
            </div>

            <template #overlay>
              <AMenu class="w-180 md:w-162">
                <AMenuItem>
                  <div class="flex items-center px-12 py-10 md:py-8 text-14 md:text-15">
                    {{ userInfo.username || '昵称。' }}
                  </div>
                </AMenuItem>
                <AMenuItem @click="handleClearChat">
                  <div class="flex items-center py-10 md:py-8 px-8 md:px-4">
                    <img src="@/assets/images/del_icon.svg" class="h-20 md:h-24 w-20 md:w-24">
                    <div class="mx-8 md:mx-10 text-14 md:text-15">
                      删除所有对话
                    </div>
                  </div>
                </AMenuItem>
                <AMenuItem v-if="hasLogPermission">
                  <div class="flex items-center py-10 md:py-8 px-8 md:px-4" @click="showOperatorLog = true">
                    <img src="@/assets/images/contact_icon.svg" class="h-20 md:h-24 w-20 md:w-24">
                    <div class="mx-8 md:mx-10 text-14 md:text-15">
                      操作日志
                    </div>
                  </div>
                </AMenuItem>
              </AMenu>
            </template>
          </ADropdown>
        </div>
      </div>
    </div>
    <!-- 收起（仅桌面端显示） -->
    <div v-show="!isCollapse && !isMobile" class="h-screen w-[var(--sidebar-min-width)] flex flex-col bg-[var(--sidebar-bg)] p-y20 text-center">
      <div>
        <img src="@/assets/images/logo.svg" class="h-40 md:h-44 w-40 md:w-44 cursor-pointer" @click="router.push('/')">
      </div>
      <div class="flex-1">
        <div class="mt-32 md:mt-38">
          <ATooltip title="打开边栏" placement="right">
            <div class="inline cursor-pointer rounded-4 p-3 md:p-4 transition-all duration-300 hover:bg-[rgb(241,245,249)] active:scale-95" @click="isCollapse = !isCollapse">
              <img class="h-24 md:h-28 w-24 md:w-28" src="@/assets/images/spread_icon.svg">
            </div>
          </ATooltip>
        </div>
        <div class="mt-40 md:mt-46">
          <ATooltip title="开启新对话" placement="right">
            <div class="inline cursor-pointer rounded-4 p-3 md:p-4 transition-all duration-300 hover:bg-[rgb(241,245,249)] active:scale-95" @click="router.push('/chat')">
              <img class="h-20 md:h-24 w-20 md:w-24" src="@/assets/images/add_new_gray_icon.svg">
            </div>
          </ATooltip>
        </div>
      </div>
      <div>
        <div class="p-x-10 md:p-x-12 p-y-8 md:p-y-10">
          <ADropdown placement="topRight" :trigger="['click']">
            <div class="flex cursor-pointer items-center justify-start rounded-12 p-6 md:p-8 transition-all duration-300 hover:bg-[var(--sidebar-hover)] active:scale-95">
              <img src="@/assets/images/default_avatar.svg" class="h-32 w-32 rounded-full">
            </div>

            <template #overlay>
              <AMenu class="w-162">
                <AMenuItem>
                  <div class="flex items-center px-12 py-8 text-14 md:text-15">
                    {{ userInfo.username || '昵称。' }}
                  </div>
                </AMenuItem>
                <AMenuItem @click="handleClearChat">
                  <div class="flex items-center py-8 px-4 text-14 md:text-15">
                    <img src="@/assets/images/del_icon.svg" class="h-20 md:h-24 w-20 md:w-24">
                    <div class="mx-8 md:mx-10">
                      删除所有对话
                    </div>
                  </div>
                </AMenuItem>
                <AMenuItem v-if="hasLogPermission">
                  <div class="flex items-center py-8 px-4 text-14 md:text-15" @click="showOperatorLog = true">
                    <img src="@/assets/images/contact_icon.svg" class="h-20 md:h-24 w-20 md:w-24">
                    <div class="mx-8 md:mx-10">
                      操作日志
                    </div>
                  </div>
                </AMenuItem>
              </AMenu>
            </template>
          </ADropdown>
        </div>
      </div>
    </div>
    <OperatorLog v-model:visible="showOperatorLog" />
    <contextHolder />
  </div>
</template>

<style lang='scss' scoped>
.a-spin-box {
  flex: 1;
  overflow-y: auto;

  :deep(.ant-spin-container) {
    height: 100%;

    > div {
      height: 100%;
    }
  }
}
</style>
