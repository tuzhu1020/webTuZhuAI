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


/**
 * @desc 合作伙伴图片
 * @type { String }
 */
export const PARTNER_IMAGE_URLS = {
    slider1: [
        "https://img.alicdn.com/imgextra/i4/O1CN01LaR7F41nGRtM4LrWR_!!6000000005062-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i2/O1CN01aUG4Lp1pIOoFDR3HM_!!6000000005337-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i4/O1CN018xHqp11HAQm1dR3W4_!!6000000000717-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i2/O1CN01cxNKfp25LdFUsauQ9_!!6000000007510-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01TZT2j51Q3rjEfObPe_!!6000000001921-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01vpH2x31ggpOSdX9RK_!!6000000004172-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i4/O1CN01oGgyot1NqT1t8yqDN_!!6000000001621-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i2/O1CN01clJQzX1jloYKcg2l3_!!6000000004589-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i4/O1CN01iGda6e1wRHat2myvC_!!6000000006304-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i1/O1CN018HEhI51QIyhzR6T33_!!6000000001954-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i2/O1CN01ZYQ6VI1x6VRw9Btrx_!!6000000006394-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i4/O1CN01HdcB621fvCCc5DuSW_!!6000000004068-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01aa2yQo1gN89RNzGE0_!!6000000004129-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01uVG86O24RIX0Neu2T_!!6000000007387-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i2/O1CN01rsyfxW1lbqxdLxtbj_!!6000000004838-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01ELhOte1KDaLm3i2mE_!!6000000001130-2-tps-400-200.png",
    ],
    slider2: [
        "https://img.alicdn.com/imgextra/i1/O1CN016HbzMz23RvfiqKMVY_!!6000000007253-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01ybcx2k29yLBZzrO52_!!6000000008136-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i2/O1CN01Mrw1oc1DzwrZdK9Qm_!!6000000000288-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01HXgMfO1pCRRwMSjq9_!!6000000005324-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i1/O1CN01rkxbRH1IhEl9Y6wHX_!!6000000000924-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i4/O1CN01ygzLuQ1koqaGBSDQG_!!6000000004731-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01lJUQwk1MfBeuwPcVS_!!6000000001461-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN018hPmYp1exCJoRcGHT_!!6000000003937-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i1/O1CN01qIrOub1a4uhfqpkkp_!!6000000003277-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01rXGSLX1QWGC5DIOkt_!!6000000001983-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01P2oLnV1e7tkPACuLZ_!!6000000003825-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i1/O1CN019jVgGt20JjjutC3Aq_!!6000000006829-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i1/O1CN01leHn3c1x6VRw9Btrl_!!6000000006394-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i2/O1CN01giz6V720wD0cwajiF_!!6000000006913-2-tps-400-200.png",
    ],
    slider3: [
        "https://img.alicdn.com/imgextra/i4/O1CN01S5Owuw1l9unfvBPVI_!!6000000004777-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i1/O1CN01PrlyXM1enZn0Ybxxu_!!6000000003916-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i1/O1CN01dqg8rM28Bxjhm2l5s_!!6000000007895-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i1/O1CN01aouCwu1JiRPoJouGL_!!6000000001062-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01FcvdSW1X9XrL5CA4d_!!6000000002881-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01jxRviY1TT0Du59mtJ_!!6000000002382-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i2/O1CN014d1bSm1mYTejvpykS_!!6000000004966-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01clVEV11KudZybXe1k_!!6000000001224-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i1/O1CN01ZfhTaT26WSR5XPLsA_!!6000000007669-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i2/O1CN019GmFf11xIs93VcmkL_!!6000000006421-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i4/O1CN0122KYaw21mQA3eqYT6_!!6000000007027-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i4/O1CN01MEuLgv1RTntR7Vi6l_!!6000000002113-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01xWaC9g1Z4AebtW2Oq_!!6000000003140-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i2/O1CN01OqU1Em1rYY0RhUK4T_!!6000000005643-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i1/O1CN01WyMoJy1MxVVAxcb9o_!!6000000001501-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01yDpUiC1xHxLvNg3Fc_!!6000000006419-2-tps-400-200.png",
    ],
    slider4: [
        "https://img.alicdn.com/imgextra/i4/O1CN01uPXqL31jTUV3Ohik8_!!6000000004549-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i2/O1CN01bMC8W01hiUEijrBqL_!!6000000004311-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i2/O1CN01qw0L3g25S2nOrdAEA_!!6000000007524-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i2/O1CN01lTgpyA29q63X4OdNt_!!6000000008118-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i2/O1CN01LZfUT322j2eA99Dbl_!!6000000007155-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01xs1Fl127DxqjBkcbq_!!6000000007764-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01lpksZa1HsP0XxKfk4_!!6000000000813-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN018hPmYp1exCJoRcGHT_!!6000000003937-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i1/O1CN01cX9Jc01ERtEYgZiFr_!!6000000000349-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN01iusfNd1s4bjM0ILUt_!!6000000005713-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i1/O1CN01MvZpYP1I8Qs4QmvCX_!!6000000000848-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i2/O1CN01bV6Z9t1g3RKcZfhAN_!!6000000004086-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i3/O1CN010JVR6F1HXnBaACYqS_!!6000000000768-2-tps-400-200.png",
        "https://img.alicdn.com/imgextra/i2/O1CN01R8gDbH1dZ5rGIK9pu_!!6000000003749-2-tps-400-200.png",
    ],
};

