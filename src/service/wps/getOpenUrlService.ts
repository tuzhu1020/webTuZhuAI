import { API_VERSION } from '@/config'
import { HTTP_ERR_SUCCESS } from '@/constant/api_status'
import { ERROR_DEFAULT_HTTP_REQUEST_FAIL } from '@/constant/error'
import axios from '@/service/index'
import { GET_WPS_OPEN_URL } from './index'

interface ResultType {
  code?: number | string
  message?: string
  data?: { url: string }
}

export default async function (payload = {}, config = {}) {
  const params = {
    ...GET_WPS_OPEN_URL,
    ...config,
    params: payload,
    version: API_VERSION,
  }
  const data: ResultType = (await axios(params)) || {}
  if (data.code == HTTP_ERR_SUCCESS) {
    return data.data
  }
  else {
    throw new Error(data.message || ERROR_DEFAULT_HTTP_REQUEST_FAIL)
  }
}
