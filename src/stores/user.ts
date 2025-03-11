import { BASE_URL } from '@/config'

import getChatListService from '@/service/chat/getChatListService'

import getUserInfoService from '@/service/user/getUserInfoService'

// import redirectHmdService from '@/service/user/redirectHmdService'

import { acceptHMRUpdate, defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  // const userInfo = ref<UserInfo | object>({})
  const userInfo = ref<any>({})
  const chatList = ref<any>([])
  const router = useRouter()

  function setToken(newToken: string) {
    token.value = newToken
  }

  function setUserInfo(newUserInfo: any) {
    userInfo.value = newUserInfo
  }

  async function getChatList() {
    try {
      const res = await getChatListService()
      chatList.value = [...res] || []
    }
    catch (message: any) {
      $message.error(message)
    }
  }

  async function redirectHMD() {
    try {
      // await redirectHmdService()
      window.location.href = `${BASE_URL}/auth/authLogin`
    }
    catch (message: any) {
      $message.error(message)
    }
  }

  async function getUserInfo(code: string) {
    try {
      const { token, userId, username, isAdmin } = await getUserInfoService({ code }) || {} as any
      setToken(token)
      setUserInfo({ userId, username, isAdmin })
      getChatList()
      // const {
      //   token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ1XzEyMyIsInVzZXJJZCI6InVfMTIzIiwiaWF0IjoxNzQwNTUzNTM2LCJ1c2VybmFtZSI6Inh4In0.8o4F71q1qh9F4T9kS3NacYLE-J_1PpW-rLYI-SgVq7Uesaa4QOnhOqgJeb-Rn-O8PnkG9EDlun6iBe6-86JOYQ',
      //   userId = 'u_123',
      //   username = 'xx',
      //   isAdmin = 1,
      // } = {}
      setToken(token)
      setUserInfo({ userId, username, isAdmin })
      getChatList()
      router.replace({ path: '/' })
    }
    catch (message: any) {
      $message.error(message)
    }
  }

  async function logout() {
    // setToken('')
    // setUserInfo({})
    // chatList.value = []
    // router.push('/')
    // $message.success('退出成功')
  }

  return {
    token,
    userInfo,
    setToken,
    setUserInfo,
    getUserInfo,
    redirectHMD,
    getChatList,
    chatList,
    logout,
  }
}, {
  persist: {
    storage: sessionStorage,
  },
  // persist: true,
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useUserStore as any, import.meta.hot))
