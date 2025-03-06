import { API_VERSION } from '@/config'
import { HTTP_ERR_SUCCESS } from '@/constant/api_status'
import { ERROR_DEFAULT_HTTP_REQUEST_FAIL } from '@/constant/error'
import axios from '@/service/index'
import { DOWNLOAD_FILE_SERVICE } from './index'

interface resultType {
  code?: string
  message?: string
  data?: object | Array<any>
}

/**
 * @desc 下载
 * @param {} payload
 * @param {} config
 * @returns {Promise<*>}
 */
export default async function (payload = {}, config = {}) {
  const params = {
    ...DOWNLOAD_FILE_SERVICE,
    ...config,
    params: payload,
    version: API_VERSION,
  }

  const data: any = await axios(params) || {}
  console.log('data', data)
  const url = window.URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = 'download'
  a.click()
  window.URL.revokeObjectURL(url)
}
