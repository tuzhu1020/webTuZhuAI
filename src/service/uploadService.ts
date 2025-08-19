import { COM_UPLOAD } from './api'
import { HTTP_ERR_SUCCESS } from '@/constant/api_status'
import { ERROR_DEFAULT_HTTP_REQUEST_FAIL } from '@/constant/error'
import { API_VERSION } from '@/config'
import axios from '@service/index'

interface resultType {
    code?: number
    msg?: string
    data?: object | Array<any>
}

/**
 * @desc 用户注册
 * @param {} payload
 * @param {} config
 * @returns {Promise<*>}
 */
export default async function (payload = {}, config = {}) {
    const params = {
        ...COM_UPLOAD,
        ...config,
        data: payload,
        version: API_VERSION
    }
    const data: resultType = await axios(params)
    if (data.code === HTTP_ERR_SUCCESS) {
        return data.data
    } else {
        throw new Error(data.msg || ERROR_DEFAULT_HTTP_REQUEST_FAIL)
    }
}
