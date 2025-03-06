import { BASE_URL } from '@/config'

/**
 * @description: 用户信息
 */
// 获取用户信息
export const GET_USER_INFO_SERVICE = {
  url: `${BASE_URL}/auth/authCallback`,
  method: 'get',
  headers: { 'content-type': 'application/json' },
  timeout: 30000,
}

// 重定向HMD
export const REDIRECT_HMD_SERVICE = {
  url: `${BASE_URL}/auth/authLogin`,
  method: 'get',
  headers: { 'content-type': 'application/json' },
  timeout: 30000,
}