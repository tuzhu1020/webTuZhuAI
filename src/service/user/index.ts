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
//注册
export const REGISTER_SERVICE = {
    url: `${BASE_URL}/users/register`,
    method: "post",
    headers: { "content-type": "application/json" },
    timeout: 30000,
};
// 登录
export const LOGIN_SERVICE = {
    url: `${BASE_URL}/users/login`,
    method: "post",
    headers: { "content-type": "application/json" },
    timeout: 30000,
};

// 退出登录
export const LOGOUT_SERVICE = {
    url: `${BASE_URL}/users/logout`,
    method: "post",
    headers: { "content-type": "application/json" },
    timeout: 30000,
};