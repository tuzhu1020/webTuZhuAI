/**
 * @desc 短信模板code
 * @type { string }
 */
export const SMS_VERIFICATION_CODE_SERVICE = '5'

/**
 * @desc 日报/周报
 * @type { string }
 */

export const DAILY_TYPE_VALUE: string = '01'
export const DAILY_TYPE_LABEL = '日报'

export const WEEK_TYPE_VALUE: string = '02'
export const WEEK_TYPE_LABEL = '周报'

export const DAILY_TYPE_LIST = [
    { value: DAILY_TYPE_VALUE, label: DAILY_TYPE_LABEL },
    { value: WEEK_TYPE_VALUE, label: WEEK_TYPE_LABEL }
]

/**
 * @desc IPO在审拓展资料内容形式枚举
 * @type { String }
 */
export const PLATE_MODEL_CONTENT_EDIT_VALUE = 0 // 富文本
export const PLATE_MODEL_CONTENT_EDIT_LABEL = '富文本' // 富文本

export const PLATE_MODEL_CONTENT_FILE_VALUE = 1 // 附件
export const PLATE_MODEL_CONTENT_FILE_LABEL = '附件' // 附件

export const PLATE_MODEL_CONTENT_TYPE_LIST = [
    {
        value: PLATE_MODEL_CONTENT_EDIT_VALUE,
        label: PLATE_MODEL_CONTENT_EDIT_LABEL
    },
    {
        value: PLATE_MODEL_CONTENT_FILE_VALUE,
        label: PLATE_MODEL_CONTENT_FILE_LABEL
    }
]

/**
 * @desc 资源类型
 * @type { Number }
 */

export const SCHEME_RESOURCE_PERFECT_TYPE = 0 // 企业优选清单

/**
 * @desc 公司分类类型
 * @type { Number }
 */

export const COMPANY_PEDDING_IPO_MENU_TYPE = 0 // 在审ipo
export const COMPANY_LISTED_MENU_TYPE = 1 // 上市
export const COMPANY_COACH_MENU_TYPE = 2 // 辅导
export const COMPANY_NEEQ_MENU_TYPE = 3 // 新三板


// 企业
export const COMPANY_MENU_PEDDING_IPO_STATUS = 0 // 在审
export const COMPANY_MENU_PEDDING_IPO_LABEL = '在审IPO' // 在审

export const COMPANY_MENU_LISTED_STATUS = 1 // 上市
export const COMPANY_MENU_LISTED_LABEL = '上市' // 上市

export const COMPANY_MENU_COACH_STATUS = 2 // 辅导
export const COMPANY_MENU_COACH_LABEL = '辅导' // 辅导

export const COMPANY_MENU_NEEQ_STATUS = 3 // 新三板
export const COMPANY_MENU_NEEQ_LABEL = '新三板' // 新三板

export const COMPANY_MENU_STATUS_LIST = [
    {
        value: COMPANY_MENU_PEDDING_IPO_STATUS,
        label: COMPANY_MENU_PEDDING_IPO_LABEL
    },
    {
        value: COMPANY_MENU_LISTED_STATUS,
        label: COMPANY_MENU_LISTED_LABEL
    },
    {
        value: COMPANY_MENU_COACH_STATUS,
        label: COMPANY_MENU_COACH_LABEL
    },
    {
        value: COMPANY_MENU_NEEQ_STATUS,
        label: COMPANY_MENU_NEEQ_LABEL
    }
]

// 企业标签
export const COMPANY_TAG_QUALITY_VALUE = '1' // 优质企业标签
export const COMPANY_TAG_HANDPICK_VALUE = '2' // 精选企业标签

/**
 * @desc 帮我找订单
 * @type { Number }
 */
export const HEML_FIND_ORDER_STATUS_WAIT_VALUE = 0
export const HEML_FIND_ORDER_STATUS_WAIT_LABEL = '等待接单'
export const HEML_FIND_ORDER_STATUS_COLLECT_VALUE = 1
export const HEML_FIND_ORDER_STATUS_COLLECT_LABEL = '信息收集中'
export const HEML_FIND_ORDER_STATUS_FINISH_VALUE = 2
export const HEML_FIND_ORDER_STATUS_FINISH_LABEL = '已完成'
export const HEML_FIND_ORDER_STATUS_LIST = [
    {
        value: HEML_FIND_ORDER_STATUS_WAIT_VALUE,
        label: HEML_FIND_ORDER_STATUS_WAIT_LABEL
    },
    {
        value: HEML_FIND_ORDER_STATUS_COLLECT_VALUE,
        label: HEML_FIND_ORDER_STATUS_COLLECT_LABEL
    },
    {
        value: HEML_FIND_ORDER_STATUS_FINISH_VALUE,
        label: HEML_FIND_ORDER_STATUS_FINISH_LABEL
    }
]

/**
 * @desc 服务类型
 * @type { String }
 */
export const SERVICE_TYPE_CONSULTING_VALUE = '1'
export const SERVICE_TYPE_CONSULTING_LABEL = '咨询服务'
export const SERVICE_TYPE_EXHIBITION_VALUE = '2'
export const SERVICE_TYPE_EXHIBITION_LABEL = '展业服务'
export const SERVICE_TYPE_RUN_VALUE = '3'
export const SERVICE_TYPE_RUN_LABEL = '陪跑服务'
export const SERVICE_TYPE_LIST = [
    {
        value: SERVICE_TYPE_CONSULTING_VALUE,
        label: SERVICE_TYPE_CONSULTING_LABEL
    },
    {
        value: SERVICE_TYPE_EXHIBITION_VALUE,
        label: SERVICE_TYPE_EXHIBITION_LABEL
    },
    {
        value: SERVICE_TYPE_RUN_VALUE,
        label: SERVICE_TYPE_RUN_LABEL
    }
]


/**
 * @desc 会员等级
 * @type { String }
 */
// 普通会员 铂金会员 钻石会员 至尊会员
export const MEMBER_GENERAL_LEVEL_VALUE = '1'
export const MEMBER_GENERAL_LEVEL_LABEL = '普通会员'

export const MEMBER_PLATINUM_LEVEL_VALUE = '2'
export const MEMBER_PLATINUM_LEVEL_LABEL = '铂金会员'

export const MEMBER_DIAMOND_LEVEL_VALUE = '3'
export const MEMBER_DIAMOND_LEVEL_LABEL = '钻石会员'

export const MEMBER_SUPER_LEVEL_VALUE = '4'
export const MEMBER_SUPER_LEVEL_LABEL = '至尊会员'

export const MEMBER_LEVEL_LIST = [
    {
        value: MEMBER_GENERAL_LEVEL_VALUE,
        label: MEMBER_GENERAL_LEVEL_LABEL
    },
    {
        value: MEMBER_PLATINUM_LEVEL_VALUE,
        label: MEMBER_PLATINUM_LEVEL_LABEL
    },
    {
        value: MEMBER_DIAMOND_LEVEL_VALUE,
        label: MEMBER_DIAMOND_LEVEL_LABEL
    },
    {
        value: MEMBER_SUPER_LEVEL_VALUE,
        label: MEMBER_SUPER_LEVEL_LABEL
    }
]


/**
 * @desc 资讯来源
 * @type { String }
 */

export const INFORMATION_SOURCE_BSTZT_VALUE: string = '百杉投资通'
export const INFORMATION_SOURCE_BSTZT_URL: string = 'https://v1.vastcloud.cn'

export const INFORMATION_SOURCE_BSBGYJY_VALUE: string = '百杉并购研究院'
export const INFORMATION_SOURCE_BSBGYJY_URL: string = 'https://v2.vastcloud.cn'


/**
 * @desc AI对话身份
 */
export const AI_IDENTITY_USER_VALUE = 'user'
export const AI_IDENTITY_USER_LABEL = '用户'

export const AI_IDENTITY_AI_VALUE = 'ai'
export const AI_IDENTITY_AI_LABEL = 'AI'


