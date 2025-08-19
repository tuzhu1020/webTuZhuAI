import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { TOKEN_KEY } from '@/config'
import { HTTP_RE_LOGIN_CODE_LIST, HTTP_REDIRECT_CODE } from '@/constant/api_status'
import { useUserStore } from '@/stores/user'
import axios from 'axios'

const request = axios.create({})

export type RequestError = AxiosError<{
  message?: string
  result?: any
  errorMessage?: string
}>

function errorHandler(error: RequestError) {
  if (error.response) {
    const { data = {}, status, statusText } = error.response
    if (status === 403) {
    //   showNotify({
    //     type: 'danger',
    //     message: (data && data.message) || statusText,
    //   })
    }
    // 401 未登录/未授权
    if (status === 401) {
      const userStore = useUserStore();
      userStore.logout();
      // router.push('/login')
    }
  }
}

// 请求拦截器
function requestHandler(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig> {
  const store: any = useUserStore()
  const savedToken = store.token || ''
  if (savedToken) {
    const hasBearer = String(savedToken).toLowerCase().startsWith('bearer ')
    config.headers[TOKEN_KEY] = hasBearer ? savedToken : `Bearer ${savedToken}`
  }
  return config
}

request.interceptors.request.use(requestHandler, errorHandler)

// 响应拦截器
function responseHandler(response: { data: any, status: number }) {
  //   const store: any = useUserStore()
  // const data = response.data
  // const respCode = data.code || response.status
  // const needReLogin = HTTP_RE_LOGIN_CODE_LIST.includes(respCode) // 根据后端返回的code判断是否需要登录
  // if (needReLogin)
  // store.logout()
  if (response.status === HTTP_REDIRECT_CODE) {
    window.location.href = response.headers.location
  }

  return { ...response.data, code: response.data.code || response.status }
}

request.interceptors.response.use(responseHandler, errorHandler)

export default request
