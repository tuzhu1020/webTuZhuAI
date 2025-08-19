import request from './index'
import { BASE_VIDEO_URL } from '@/config'

const BASE = `${BASE_VIDEO_URL}/api`

export interface VideoPayload {
  title: string
  description?: string
  tags?: string[]
  coverUrl: string
  videoUrl: string
  duration?: number
}

export function getHotVideos(params: { page?: number; size?: number } = {}) {
  return request({ url: `${BASE}/videos/hot`, method: 'get', params })
}

export function getRecommendVideos(params: { page?: number; size?: number } = {}) {
  return request({ url: `${BASE}/videos/recommend`, method: 'get', params })
}

export function getVideoDetail(id: string) {
  return request({ url: `${BASE}/videos/${id}`, method: 'get' })
}

export function createVideo(data: VideoPayload) {
  return request({ url: `${BASE}/videos`, method: 'post', data })
}

export function incView(id: string) {
  return request({ url: `${BASE}/videos/${id}/view`, method: 'post' })
}
