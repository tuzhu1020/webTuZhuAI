import { BASE_URL } from '@/config'

/**
 * @description: 操作日志
 */
// 获取操作日志记录
export const GET_LOGS = {
  url: `${BASE_URL}/count/user/logs`,
  method: 'get',
  headers: { 'content-type': 'application/json' },
  timeout: 30000,
}

// 获取操作日志详情
export const GET_LOG_DETAIL = {
  url: `${BASE_URL}/count/user/logs/detail`,
  method: 'get',
  headers: { 'content-type': 'application/json' },
  timeout: 30000,
}
