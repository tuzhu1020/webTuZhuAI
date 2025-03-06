import { API_VERSION } from '@/config'
import { HTTP_ERR_SUCCESS } from '@/constant/api_status'
import { ERROR_DEFAULT_HTTP_REQUEST_FAIL } from '@/constant/error'
import axios from '@/service/index'
import { SEND_USER_MESSAGE_SERVICE } from './index'

interface resultType {
  code?: number | string
  msg?: string
  data?: object | Array<any>
}

/**
 * @desc 发送消息（用户）
 * @param {} payload
 * @param {} config
 * @returns {Promise<*>}
 */
export default async function (payload = {}, config = {}) {
  const params = {
    ...SEND_USER_MESSAGE_SERVICE,
    ...config,
    data: payload,
    version: API_VERSION,
  }

  const data: resultType = await axios(params) || {}
  if (data.code === HTTP_ERR_SUCCESS) {
    return data
  }
  else {
    throw new Error(data.msg || ERROR_DEFAULT_HTTP_REQUEST_FAIL)
  }
}
