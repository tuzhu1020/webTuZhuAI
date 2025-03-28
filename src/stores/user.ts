import { BASE_URL } from "@/config";

import getChatListService from "@/service/chat/getChatListService";

import getUserInfoService from "@/service/user/getUserInfoService";

// import redirectHmdService from '@/service/user/redirectHmdService'

import { acceptHMRUpdate, defineStore } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "@/service";

interface LoginForm {
    username: string;
    password: string;
}

interface RegisterForm extends LoginForm {
    email: string;
    confirmPassword: string;
}

export const useUserStore = defineStore(
    "user",
    () => {
        const token = ref<string>("");
        // const userInfo = ref<UserInfo | object>({})
        const userInfo = ref<any>(null);
        const chatList = ref<any>([]);
        const router = useRouter();

        function setToken(newToken: string) {
            token.value = newToken;
        }

        function setUserInfo(newUserInfo: any) {
            userInfo.value = newUserInfo;
        }

        async function getChatList() {
            try {
                const res = await getChatListService();
                chatList.value = [...res] || [];
            } catch (message: any) {
                $message.error(message);
            }
        }

        async function redirectHMD() {
            try {
                // await redirectHmdService()
                window.location.href = `${BASE_URL}/auth/authLogin`;
            } catch (message: any) {
                $message.error(message);
            }
        }

        async function getUserInfo(code: string) {
            try {
                const { token, userId, username, isAdmin } =
                    (await getUserInfoService({ code })) || ({} as any);
                setToken(token);
                setUserInfo({ userId, username, isAdmin });
                getChatList();
                // const {
                //   token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ1XzEyMyIsInVzZXJJZCI6InVfMTIzIiwiaWF0IjoxNzQwNTUzNTM2LCJ1c2VybmFtZSI6Inh4In0.8o4F71q1qh9F4T9kS3NacYLE-J_1PpW-rLYI-SgVq7Uesaa4QOnhOqgJeb-Rn-O8PnkG9EDlun6iBe6-86JOYQ',
                //   userId = 'u_123',
                //   username = 'xx',
                //   isAdmin = 1,
                // } = {}
                setToken(token);
                setUserInfo({ userId, username, isAdmin });
                getChatList();
                router.replace({ path: "/" });
            } catch (message: any) {
                $message.error(message);
            }
        }

        // 登录
        const login = async (form: LoginForm) => {
            try {
                const res = await axios.post("/api/users/login", form);
                setToken(res.data.token);
                setUserInfo(res.data.user);
                return res.data;
            } catch (error: any) {
                throw new Error(error.response?.data?.message || "登录失败");
            }
        };

        // 注册
        const register = async (form: RegisterForm) => {
            try {
                const res = await axios.post("/api/users/register", form);
                return res.data;
            } catch (error: any) {
                throw new Error(error.response?.data?.message || "注册失败");
            }
        };

        // 登出
        const logout = () => {
            token.value = "";
            userInfo.value = null;
            router.push("/login");
        };

        return {
            token,
            userInfo,
            setToken,
            setUserInfo,
            getUserInfo,
            redirectHMD,
            getChatList,
            chatList,
            login,
            register,
            logout,
        };
    },
    {
        persist: {
            key: "user-store",
            storage: localStorage,
        },
        // persist: true,
    },
);

if (import.meta.hot)
    import.meta.hot.accept(
        acceptHMRUpdate(useUserStore as any, import.meta.hot),
    );
