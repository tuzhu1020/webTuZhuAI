<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import type { FormRule } from "ant-design-vue/es/form";
import {
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  Button as AButton,
  Card as ACard,
  message,
} from "ant-design-vue";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  GithubOutlined,
  GoogleOutlined,
} from "@ant-design/icons-vue";
import { useUserStore } from "@/stores/user";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 检查是否已登录
onMounted(() => {
  if (userStore.token) {
    router.replace("/");
  }
});

// 表单状态
const isLogin = ref(true);
const loading = ref(false);

// 表单数据
const formState = reactive({
  username: "",
  password: "",
  email: "",
  confirmPassword: "",
});

// 表单规则
const rules: Record<string, FormRule[]> = {
  username: [
    {
      required: true,
      type: "string",
      message: "请输入用户名",
      trigger: "blur",
    },
  ],
  password: [
    { required: true, type: "string", message: "请输入密码", trigger: "blur" },
  ],
  email: [
    { required: true, type: "string", message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, type: "string", message: "请确认密码", trigger: "blur" },
    {
      validator: async (_rule: any, value: string) => {
        if (value !== formState.password) {
          throw new Error("两次输入的密码不一致");
        }
        return true;
      },
      trigger: "blur",
    },
  ],
};
const handleSubmit = () => {
  return isLogin.value ? handleLogin() : handleRegister();
};
// 处理登录
const handleLogin = async () => {
  try {
    loading.value = true;
    await userStore.login(formState);
    message.success("登录成功");
    const redirect = route.query.redirect as string;
    // 优先跳转到重定向地址，如果没有则跳转到首页
    router.replace(redirect || "/");
  } catch (error: any) {
    message.error(error.message || "登录失败");
  } finally {
    loading.value = false;
  }
};

// 处理注册
const handleRegister = async () => {
  try {
    loading.value = true;
    await userStore.register(formState);
    message.success("注册成功");
    isLogin.value = true;
  } catch (error: any) {
    message.error(error.message || "注册失败");
  } finally {
    loading.value = false;
  }
};
const handleFinishFailed = (errorInfo: any) => {
  console.log(errorInfo, "errorInfo");
};
// 切换登录/注册
const toggleMode = () => {
  isLogin.value = !isLogin.value;
  formState.username = "";
  formState.password = "";
  formState.email = "";
  formState.confirmPassword = "";
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[url('@/assets/images/login-bg.jpg')]   bg-cover bg-center ">
    <div class="w-full max-w-500 p-4">
      <ACard class="shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
        <div class="text-center mb-8">
          <h1 class=" font-bold text-gray-800 mb-2">欢迎回来</h1>
          <p class="text-gray-600">{{ isLogin ? '请登录您的账号' : '创建新账号' }}</p>
        </div>
        <AForm :model="formState" :rules="rules" layout="vertical" @finish="handleSubmit" class="space-y-10">
          <AFormItem name="username">
            <AInput v-model:value="formState.username" placeholder="用户名" size="large" class="rounded-lg" autocomplete="off">
              <template #prefix>
                <UserOutlined class="text-gray-400" />
              </template>
            </AInput>
          </AFormItem>

          <AFormItem name="password">
            <AInput.Password v-model:value="formState.password" placeholder="密码" size="large" class="rounded-lg" autocomplete="off">
              <template #prefix>
                <LockOutlined class="text-gray-400" />
              </template>
            </AInput.Password>
          </AFormItem>

          <template v-if="!isLogin">
            <AFormItem name="confirmPassword">
              <AInput.Password v-model:value="formState.confirmPassword" placeholder="确认密码" size="large" class="rounded-lg" autocomplete="off">
                <template #prefix>
                  <LockOutlined class="text-gray-400" />
                </template>
              </AInput.Password>
            </AFormItem>

            <AFormItem name="email">
              <AInput v-model:value="formState.email" placeholder="邮箱" size="large" class="rounded-lg" autocomplete="off">
                <template #prefix>
                  <MailOutlined class="text-gray-400" />
                </template>
              </AInput>
            </AFormItem>
          </template>

          <AFormItem>
            <AButton type="primary" html-type="submit" :loading="loading" class="w-full h-12 text-lg rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              {{ isLogin ? '登录' : '注册' }}
            </AButton>
          </AFormItem>

          <!-- <div class="grid grid-cols-2 gap-4">
            <AButton class="h-12 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors duration-300" @click="handleThirdPartyLogin('GitHub')">
              <GithubOutlined class="mr-2" />
              GitHub
            </AButton>
            <AButton class="h-12 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors duration-300" @click="handleThirdPartyLogin('Google')">
              <GoogleOutlined class="mr-2" />
              Google
            </AButton>
          </div> -->

          <div class="text-center">
            <a class="text-blue-600 hover:text-blue-800 transition-colors duration-300" @click="toggleMode">
              {{ isLogin ? '没有账号？立即注册' : '已有账号？立即登录' }}
            </a>
          </div>
        </AForm>
        <!-- <div class="mt-6 text-center  text-gray-600">
          <p>登录即表示您同意我们的</p>
          <div class="mt-1">
            <a href="#" class="text-blue-600 hover:text-blue-800 mr-2">服务条款</a>
            <span class="text-gray-400">和</span>
            <a href="#" class="text-blue-600 hover:text-blue-800 ml-2">隐私政策</a>
          </div>
        </div> -->
      </ACard>
    </div>
  </div>
</template>
<style scoped>
.css-dev-only-do-not-override-1p3hq3p.ant-form-item {
  margin-bottom: 0;
}
</style>

<route lang="yaml">
meta:
  layout: blank
  title: 登录
  requiresAuth: false
</route> 