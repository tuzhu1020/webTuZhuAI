import { AI_BASE_URL, BASE_URL } from '@/config'

/**
 * @description: AI接口聊天
 */

export const SEND_USER_MESSAGE_SERVICE = {
  url: `${AI_BASE_URL}/v1/chat/completions`,
  // url: `${AI_BASE_URL}/chat_and_rag`,
  method: 'post',
  headers: { 'content-type': 'application/json' },
  timeout: 30000,
}

// ai知识库搜索根据用户输入内容返回对应的知识库内容
export const SEARCH_KNOWLEDGE_SERVICE = {
  url: `${AI_BASE_URL}/query_documents`,
  method: 'get',
  headers: { 'content-type': 'application/json' },
  timeout: 30000,
}

// 知识库下载文件
export const DOWNLOAD_FILE_SERVICE = {
  url: `${AI_BASE_URL}/get_file`,
  method: 'get',
  responseType: 'blob',
  headers: { 'content-Type': 'application/json' },
  timeout: 30000,
}

// 获取会话列表
export const GET_CHAT_LIST_SERVICE = {
  url: `${BASE_URL}/chat/conversations`,
  method: 'get',
  headers: { 'content-type': 'application/json' },
  timeout: 30000,
}

// 创建新会话
export const CREATE_NEW_USER_SERVICE = {
  url: `${BASE_URL}/chat/create/conversations`,
  method: 'post',
  headers: { 'content-type': 'application/json' },
  timeout: 30000,
}

// 删除会话
export const DELETE_CHAT_SERVICE = {
  url: `${BASE_URL}/chat/delete/conversations`,
  method: 'delete',
  headers: { 'content-type': 'application/json' },
  timeout: 30000,
}

// 删除所有会话
export const DELETE_ALL_CHAT_SERVICE = {
  url: `${BASE_URL}/chat/delete/all/conversations`,
  method: 'delete',
  headers: { 'content-type': 'application/json' },
  timeout: 30000,
}

// 获取会话详情
export const GET_CHAT_DETAIL_SERVICE = {
  url: `${BASE_URL}/chat/conversations/messages`,
  method: 'get',
  headers: { 'content-type': 'application/json' },
  timeout: 30000,
}

// 重命名会话
export const RENAME_CHAT_SERVICE = {
  url: `${BASE_URL}/chat/update/title`,
  method: 'put',
  headers: { 'content-type': 'application/json' },
  timeout: 30000,
}

// 保存聊天记录
export const SAVE_CHAT_RECORD_SERVICE = {
  url: `${BASE_URL}/chat/messages`,
  method: 'post',
  headers: { 'content-type': 'application/json' },
  timeout: 30000,
}
