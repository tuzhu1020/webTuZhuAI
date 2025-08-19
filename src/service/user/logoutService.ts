import { API_VERSION } from '@/config'
import { HTTP_ERR_SUCCESS } from '@/constant/api_status'
import { ERROR_DEFAULT_HTTP_REQUEST_FAIL } from '@/constant/error'
import axios from '@/service/index'
import { LOGOUT_SERVICE } from './index'

interface resultType {
  code?: string
  message?: string
  data?: any
}

/**
 * @desc 退出登录
 * @param {} payload
 * @param {} config
 * @returns {Promise<*>}
 */
export default async function (payload = {}, config = {}) {
  const params = {
    ...LOGOUT_SERVICE,
    ...config,
    data: payload,
    version: API_VERSION,
  }

  const data: resultType = (await axios(params)) || {}
  if (data.code === HTTP_ERR_SUCCESS) {
    return data.data
  }
  else {
    throw new Error(data.message || ERROR_DEFAULT_HTTP_REQUEST_FAIL)
  }
}
