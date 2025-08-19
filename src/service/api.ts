import { BASE_URL } from '@/config'

/**
 * 基础查询接口
 * ————————————————————————————————————————————————————————————————————————————————————————————
 */

export const GET_DAILY_LIST = {
  url: `${BASE_URL}/base/financial-documents-info/page`,
  method: 'post',
  headers: { 'content-type': 'application/json' },
  timeout: 30000,
}

// 机构列表
export const GET_AGENCY_LIST = {
  url: `${BASE_URL}/base/agency/select`,
  method: 'get',
  headers: { 'content-type': 'application/json' },
  timeout: 30000,
}

// 全国省市区
export const GET_ALL_ADDRESS = {
  url: `${BASE_URL}/base/address/all`,
  method: 'get',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
}

// 上传
export const COM_UPLOAD = {
  url: `${BASE_URL}/base/oss/upload`,
  method: 'post',
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 30000,
}

// 下载
export const DOWNLOAD = {
  url: `${BASE_URL}/base/oss/downOSSFile`,
  method: 'get',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
}

// 发送验证码
export const SMS_SEND = {
  url: `${BASE_URL}/crm/sms/verificationCode`,
  method: 'post',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
}
