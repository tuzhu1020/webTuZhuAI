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
});
</script>

<template>
  <div>
    <!-- 展开 -->
    <div v-if="isCollapse" class="h-screen w-[var(--sidebar-width)] flex flex-col bg-[var(--sidebar-bg)]">
      <!-- header -->
      <div class="flex items-center justify-between p-b-34 p-l-20 p-r-10 p-t-25">
        <img class="h-26" src="@/assets/images/logo_text.svg" @click="router.push('/')">
        <ATooltip title="收起边栏" placement="bottom">
          <div class="cursor-pointer rounded-4 p-2 transition-all duration-300 hover:bg-[rgb(241,245,249)]" @click="isCollapse = !isCollapse">
            <img class="h-28 w-28" src="@/assets/images/collapse_icon.svg">
          </div>
        </ATooltip>
      </div>
      <!-- 开启新对话 -->
      <div class="mb-34">
        <div class="ml-14 h-44 flex-inline cursor-pointer items-center rounded-14 bg-[var(--primary-bg-color)] p-x-10 transition-all duration-600 hover:bg-[var(--button-hover)]" @click="router.push('/chat')">
          <img class="m-r-10 h-22 w-22" src="@/assets/images/add_new_icon.svg">
          <div class="color-[var(--primary-color)]">
            开启新对话
          </div>
        </div>
      </div>
      <!-- content -->
      <ASpin wrapper-class-name="a-spin-box" class="h-full" :spinning="loading">
        <!-- 暂无数据 -->
        <div v-if="isCollapse && !sideChatList.length" class="flex flex-1 items-center justify-center text-14 color-[var(--label-color)]">
          <div>暂无历史对话</div>
        </div>
        <!-- 有数据 -->
        <div v-if="sideChatList.length" class="flex-1">
          <div v-for="(item, index) in sideChatList" :key="index" class="mb-24 px-10">
            <div class="mb-6 px-10 pb-10 text-13 text-#555 font-600 sticky top-0 z-10 bg-[var(--sidebar-bg)]">
              {{ item.timeStr }}
            </div>
            <div v-for="cur in item.list" :key="cur.id" class="group relative box-border h-38 w-full cursor-pointer overflow-hidden rounded-12 px-10 transition-all duration-300 hover:bg-[var(--sidebar-hover)]" :class="curChatId === String(cur.id) ? 'bg-[var(--primary-bg-color)]' : ''" @click="router.push({ path: `/chat/${cur.id}` })">
              <div class="whitespace-nowp overflow-hidden p-r-12 text-15 text-[var(--text-color)] lh-38">
                <ATooltip v-if="!cur._isEdit" placement="top">
                  {{ cur.title }}
                </ATooltip>
                <AInput v-if="cur._isEdit" :id="cur._refContent" v-model:value="cur.title" type="text" placeholder="请输入标签" :maxlength="32" @blur="handleUpdateTitle(cur)" />
              </div>
              <div v-if="!cur._isEdit" class="absolute right-12 top-50% z-2 hidden translate-y-[-50%] rounded-12 p4 group-hover:block hover:bg-white">
                <ADropdown :trigger="['click']">
                  <img class="h-16 w-16" src="@/assets/images/more_icon.svg" @click.stop="() => {}">
                  <template #overlay>
                    <AMenu>
                      <AMenuItem>
                        <div class="flex items-center py-8" @click="handleShowEdit(cur.id)">
                          <img src="@/assets/images/edit_icon.svg" class="h-24 w-24">
                          <div class="mx-10">
                            重命名
                          </div>
                        </div>
                      </AMenuItem>
                      <AMenuItem>
                        <div class="flex items-center py-8" @click="handleDel(cur.id)">
                          <img src="@/assets/images/del_red_icon.svg" class="h-24 w-24">
                          <div class="mx-10 color-[var(--danger-color)]">
                            删除
                          </div>
                        </div>
                      </AMenuItem>
                    </AMenu>
                  </template>
                </ADropdown>
              </div>
              <div v-if="!cur._isEdit" class="absolute right-0 top-0 z-1 h-full w-84 from-[rgb(249,251,255)] bg-gradient-to-l" />
            </div>
          </div>
        </div>
      </ASpin>
      <!-- 个人信息 -->
      <div>
        <div class="p-x-12 p-y-10">
          <ADropdown placement="top" :trigger="['click']">
            <div class="flex cursor-pointer items-center justify-start rounded-12 p-8 transition-all duration-300 hover:bg-[var(--sidebar-hover)]">
              <img src="@/assets/images/default_avatar.svg" class="h-32 w-32 rounded-full">
              <div class="ml-14 text-14 color-[rgb(82,82,82)]">
                个人信息
              </div>
            </div>

            <template #overlay>
              <AMenu class="w-162">
                <AMenuItem>
                  <div class="flex items-center px-12 py-8">
                    {{ userInfo.username || '昵称。' }}
                  </div>
                </AMenuItem>
                <!-- <AMenuItem>
                  <div class="flex items-center py-8">
                    <img src="@/assets/images/setting_icon.svg" class="h-24 w-24">
                    <div class="mx-10">
                      系统设置
                    </div>
                  </div>
                </AMenuItem> -->
                <AMenuItem @click="handleClearChat">
                  <div class="flex items-center py-8">
                    <img src="@/assets/images/del_icon.svg" class="h-24 w-24">
                    <div class="mx-10">
                      删除所有对话
                    </div>
                  </div>
                </AMenuItem>
                <!-- <AMenuItem>
                  <div class="flex items-center py-8">
                    <img src="@/assets/images/contact_icon.svg" class="h-24 w-24">
                    <div class="mx-10">
                      联系我们
                    </div>
                  </div>
                </AMenuItem> -->
                <AMenuItem v-if="hasLogPermission">
                  <div class="flex items-center py-8" @click="showOperatorLog = true">
                    <img src="@/assets/images/contact_icon.svg" class="h-24 w-24">
                    <div class="mx-10">
                      操作日志
                    </div>
                  </div>
                </AMenuItem>
                <!-- <AMenuItem>
                  <div class="flex items-center py-8" @click="userStore.logout">
                    <img src="@/assets/images/logout_icon.svg" class="h-24 w-24">
                    <div class="mx-10">
                      退出登录
                    </div>
                  </div>
                </AMenuItem> -->
              </AMenu>
            </template>
          </ADropdown>
        </div>
      </div>
    </div>
    <!-- 收起 -->
    <div v-show="!isCollapse" class="h-screen w-[var(--sidebar-min-width)] flex flex-col bg-[var(--sidebar-bg)] p-y20 text-center">
      <div>
        <img src="@/assets/images/logo.svg" class="h-44 w-44 cursor-pointer" @click="router.push('/')">
      </div>
      <div class="flex-1">
        <div class="mt-38">
          <ATooltip title="打开边栏" placement="right">
            <div class="inline cursor-pointer rounded-4 p-4 transition-all duration-300 hover:bg-[rgb(241,245,249)]" @click="isCollapse = !isCollapse">
              <img class="h-28 w-28" src="@/assets/images/spread_icon.svg">
            </div>
          </ATooltip>
        </div>
        <div class="mt-46">
          <ATooltip title="开启新对话" placement="right">
            <div class="inline cursor-pointer rounded-4 p-4 transition-all duration-300 hover:bg-[rgb(241,245,249)]" @click="router.push('/chat')">
              <img class="h-24 w-24" src="@/assets/images/add_new_gray_icon.svg">
            </div>
          </ATooltip>
        </div>
      </div>
      <div>
        <div class="p-x-12 p-y-10">
          <ADropdown placement="topRight" :trigger="['click']">
            <div class="flex cursor-pointer items-center justify-start rounded-12 p-8 transition-all duration-300 hover:bg-[var(--sidebar-hover)]">
              <img src="@/assets/images/default_avatar.svg" class="h-32 w-32 rounded-full">
            </div>

            <template #overlay>
              <AMenu class="w-162">
                <AMenuItem>
                  <div class="flex items-center px-12 py-8">
                    {{ userInfo.username || '昵称。' }}
                  </div>
                </AMenuItem>
                <!-- <AMenuItem>
                  <div class="flex items-center py-8">
                    <img src="@/assets/images/setting_icon.svg" class="h-24 w-24">
                    <div class="mx-10">
                      系统设置
                    </div>
                  </div>
                </AMenuItem> -->
                <AMenuItem @click="handleClearChat">
                  <div class="flex items-center py-8">
                    <img src="@/assets/images/del_icon.svg" class="h-24 w-24">
                    <div class="mx-10">
                      删除所有对话
                    </div>
                  </div>
                </AMenuItem>
                <AMenuItem v-if="hasLogPermission">
                  <div class="flex items-center py-8" @click="showOperatorLog = true">
                    <img src="@/assets/images/contact_icon.svg" class="h-24 w-24">
                    <div class="mx-10">
                      操作日志
                    </div>
                  </div>
                </AMenuItem>
                <!-- <AMenuItem>
                  <div class="flex items-center py-8">
                    <img src="@/assets/images/contact_icon.svg" class="h-24 w-24">
                    <div class="mx-10">
                      联系我们
                    </div>
                  </div>
                </AMenuItem>
                <AMenuItem>
                  <div class="flex items-center py-8" @click="userStore.logout">
                    <img src="@/assets/images/logout_icon.svg" class="h-24 w-24">
                    <div class="mx-10">
                      退出登录
                    </div>
                  </div>
                </AMenuItem> -->
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
