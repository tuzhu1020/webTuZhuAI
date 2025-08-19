export const HTTP_ERR_SUCCESS: string = '200'

export const HTTP_ERR_FAIL = '0'

export const NO_JUMP_TO_LOGIN_PATH_LIST = ['/error_page/500', '/error_page/400'] // 接口报错不需要跳转到登录页

/**
 * @desc 授权失败code
 * @type { Array }
 */
export const HTTP_ERR_UNAUTHORIZED = 401

/**
 * @desc 重登陆code
 * @type { Array }
 */
export const HTTP_RE_LOGIN_CODE_LIST = [HTTP_ERR_UNAUTHORIZED]

/**
 * @desc 重定向
 * @type { Number }
 */
export const HTTP_REDIRECT_CODE = 302