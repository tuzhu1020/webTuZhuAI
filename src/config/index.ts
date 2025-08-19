// 接口地址
export const BASE_URL = import.meta.env.VITE_APP_PROXY_PATH
export const BASE_URL_CRM = import.meta.env.VITE_APP_CRM_PROXY_PATH
export const AI_BASE_URL = import.meta.env.VITE_APP_AI_PROXY_PATH
export const BASE_VIDEO_URL = import.meta.env.VITE_APP_VIDEO_API_URL

// 接口版本号
export const API_VERSION = '1.0.0'

// 系统token key 名称
export const TOKEN_KEY = 'Authorization'

// 是否是生产环境
export const IS_PROD = import.meta.env.MODE !== 'development'

// token 有效期 1（天）
export const TOKEN_TIME = 60 * 60 * 24

// 最大秒数
export const MAX_SECOND_NUM = 60

// 默认跳转路径
export const DEFAULT_REDIRECT_PATH = '/'

// APPID
// export const APPID = 'wxe72b4501cc6b4345'
export const APPID = 'wx0e2b3f8789d371d1'
// AppSecret
// export const APP_SECRET = '52f80872e3e7ecd53beb341722e5f6f1'
export const APP_SECRET = '9ee8e71b55545b83f34b5ddc5649d03c'

export const routeWhiteList = ['home', 'aiHelp', 'loginHome', 'information', 'my', 'helpFind']

// 系统免鉴权白名单
export const WHITE_LIST = [
  'home',
  'information',
  'informationDetail',
  '404',
  'register',
  'login',
  'forgotPassword',
  'addressSel',
  'openMember',
  'my',
  'helpFind',
  'aiHelp',
  'homeNewDetail',
  'companyCoach',
  'homeCompanyDetail',
  'companyListed',
  'companyNeeq',
  'companyPeddingIpo',
  'homeNewDetail',
  'preFile',
  'aiCustomerSearch',
  'homeCompanySearch',
]
