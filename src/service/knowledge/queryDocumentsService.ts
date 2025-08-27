import axios from 'axios'

// 固定的知识库查询接口与授权
const KB_BASE_URL = 'http://47.99.166.37:5999'
const KB_PATH = '/backendApi/know/queryDocuments'
const KB_AUTH = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJiY2RlZWM0OC1kMGYzLTRjZWUtYjBmMi1mNDRmMGQ5N2ExMTEiLCJ1c2VySWQiOiJiY2RlZWM0OC1kMGYzLTRjZWUtYjBmMi1mNDRmMGQ5N2ExMTEiLCJpYXQiOjE3NTYyNjYxNTksInVzZXJuYW1lIjoi5Zyf54yqIn0.Vi-8BkZgW0LksOMnMtnlpRLFkEtlFKvcmrJi9YD1bHQQ51XKLcqmwpsTh_biVPsgxEj9QxfzivjO665JiXDz2Q'

// 独立 axios 实例，避免全局拦截器覆盖授权头
const kbRequest = axios.create({
  baseURL: KB_BASE_URL,
  timeout: 30000,
  headers: {
    'content-type': 'application/json',
    'Authorization': KB_AUTH,
  },
  // 兼容自签名证书场景（与 curl 的 --insecure 对齐）；浏览器环境会忽略
  httpsAgent: undefined as any,
})

export interface KBDocItem {
  _distance?: number
  filename?: string
  filepath?: string
  person_list?: string
  secret_level?: string
  text?: string
  type?: string
  vector?: string
  url?: string
  distanceScore?: number
  isSelected?: boolean
}

export interface KBQueryResponse {
  code: number
  data?: KBDocItem[]
  clean_data?: KBDocItem[]
  message?: string
}

/**
 * 查询知识库
 * @param question 文本内容
 * @returns clean_data 优先，否则 data，均为知识片段数组
 */
export default async function queryDocuments(question: string): Promise<KBDocItem[]> {
  if (!question) return []
  const resp = await kbRequest.get<KBQueryResponse>(KB_PATH, {
    params: { question, classifyList: 1 },
  })
  const payload = resp.data || ({} as KBQueryResponse)
  if (payload.code === 200) {
    const list = payload.clean_data && payload.clean_data.length > 0 ? payload.clean_data : (payload.data || [])
    return list
  }
  throw new Error(payload.message || '知识库查询失败')
}
