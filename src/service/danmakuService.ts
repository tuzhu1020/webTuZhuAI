import request from './index'
import { BASE_VIDEO_URL } from '@/config'

const BASE = `${BASE_VIDEO_URL}/api`

export interface DanmakuPayload {
  content: string
  color?: string
  fontSize?: number
  mode?: 'scroll' | 'top' | 'bottom'
  time: number
}

export function getDanmaku(videoId: string, params: { from?: number; to?: number } = {}) {
  return request({ url: `${BASE}/danmaku/${videoId}`, method: 'get', params })
}

export function sendDanmaku(videoId: string, data: DanmakuPayload) {
  return request({ url: `${BASE}/danmaku/${videoId}`, method: 'post', data })
}
