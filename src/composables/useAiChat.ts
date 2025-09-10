// no vue reactivity needed in this composable file-level scope
import { useChatStore } from '@/stores/chat';
import { useUserStore } from '@/stores/user';
import { AI_IDENTITY_AI_VALUE } from '@/constant/enum';
import queryDocuments, { type KBDocItem } from '@/service/knowledge/queryDocumentsService';
import { $message } from '@/composables/antMessage';

// 简单的会话控制器：用于在外部触发“暂停”某次流式会话
export const aiSessionControl = {
  _paused: new Set<string>(),
  pause(sessionId: string) { if (sessionId) this._paused.add(sessionId); },
  resume(sessionId: string) { if (sessionId) this._paused.delete(sessionId); },
  isPaused(sessionId: string) { return !!sessionId && this._paused.has(sessionId); },
};

export interface StreamChatParams {
  sessionId?: string;
  messages: any[];
  model?: string;
  // 可传入外部维护的数组用于承接 SSE（如用于 UI 渲染）
  chatMessageList?: any[];
  // 每帧增量回调（比如更新富文本/滚动等）
  onDelta?: (args: { chatMessageList: any[]; done: boolean }) => void | Promise<void>;
  // 完成回调
  onDone?: (args: { chatMessageList: any[] }) => void | Promise<void>;
  // 附带检索/知识库信息
  docs?: any[] | null;
}

export function useAiChat() {
  const chatStore = useChatStore();
  const userStore = useUserStore();
  // 允许的风格列表
  const allowedStyles = ['学术', '公文', '日常', '网络', '科普', '文学', '中性正式'];

  // 从用户问题查询知识库
  async function fetchKnowledge(question: string): Promise<KBDocItem[]> {
    try {
      const docs = await queryDocuments(question);
      return Array.isArray(docs) ? docs : [];
    } catch (e) {
      console.warn('知识库查询失败:', e);
      return [];
    }
  }

  // 构造参考片段字符串（供提示词参考使用）
  function buildKbRefs(docs: KBDocItem[]): string {
    if (!docs?.length) return '';
    const top = docs.slice(0, 8);
    const refs = top
      .map((d, i) => `【${i + 1}】${(d.text || '').trim()}`)
      .join('\n');
    return refs;
  }

  /**
   * 生成 AI 消息体
   * @param {string} text - 要处理的文本
   * @param {string} style - 写作风格
   * @param {'润色'|'写作'} mode - 模式，润色或智能写作
   * @returns {Array} messages - AI 请求消息数组
   */
  function createAIMessages(
    text: string,
    style: string = '中性正式',
    mode: '润色' | '写作' = '润色',
    refs?: string,
    options?: { len?: 'short' | 'mid' | 'long'; requires?: string[]; wordLimit?: number; strictWordLimit?: boolean }
  ) {
    const selectedStyle = allowedStyles.includes(style) ? style : '中性正式';
    // system 提示词
    const systemContent = `
      你是一个关于法律相关专业的中文写作助手。请严格遵守以下规则：
      1. 输出内容必须是「纯 Markdown 文本」，禁止使用任何代码围栏（如 \`\`\` 或 ~~~）。
      2. 保持原文语义不变，但要优化语法、逻辑、用词与表达流畅度，可适度调整结构使其更自然。
      3. 必须保留 Markdown 格式和排版（如标题、列表、引用等），只润色文字或生成内容，不改变结构。
      4. 禁止添加任何额外说明、解释或多余文字，只输出正文内容。
      5. 根据用户提供的写作风格参数进行处理，若无参数或参数无效则默认采用「中性正式」风格。
      6. 当文档信息不完整，可以结合模型知识补充，要尽可能的详细, 请勿省略。
      7. 可参考提供的片段进行处理，但请不要在输出中标注任何来源、链接或序号。
    `;

    // user 提示词，根据模式区分
    let userContent = '';
    const refsSection = refs ? `\n\n参考片段：\n\n${refs}\n\n` : '\n\n';
    if (mode === '润色') {
      userContent = `请以「${selectedStyle}」风格，${refs ? '参考以下片段：' : ''}${refsSection}对以下内容进行智能润色，并仅输出润色后的正文（不要标注来源或序号）：\n\n${text}`;
    } else if (mode === '写作') {
      const lenMap: Record<string, string> = { short: '简短', mid: '适中', long: '较长' };
      const reqs = options?.requires && options.requires.length ? options.requires.join('、') : '结构清晰、简洁明了、无错别字';
      const hasLimit = typeof options?.wordLimit === 'number' && options.wordLimit > 0;
      const strict = Boolean(options?.strictWordLimit);
      const lenLabel = lenMap[options?.len || 'mid'];
      const lengthPhrase = hasLimit
        ? (strict ? `严格为 ${options!.wordLimit} 字（±0）` : `控制在约 ${options!.wordLimit} 字（±20%）`)
        : `${lenLabel}篇幅`;
      const strictRules = hasLimit && strict
        ? `\n- 字数必须严格等于 ${options!.wordLimit}（不多不少）。\n- 字数统计仅计算可见正文文字，不计入 Markdown 标记（如#、*、-、[]()等符号）。\n- 若可能超出，请自行删减；若不足，请补充内容使总字数恰为 ${options!.wordLimit}。\n- 禁止输出任何说明、抱歉或附加话语。`
        : '';
      userContent = `请以「${selectedStyle}」风格，严格按照下列“要求”，围绕“意图”创作一段${lengthPhrase}的中文内容。请自动生成合适的标题与小节结构；每段围绕一个核心观点；禁止输出任何解释性话语；输出必须为纯 Markdown 文本（不得使用代码块围栏）。${strictRules}\n` +
        `意图：${text}\n` +
        `要求：${reqs}\n` +
        `受众：通用读者。${refsSection}`;
    }

    return [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent }
    ];
  }

  /**
   * 续写提示词
   * - 场景1：根据全文续写
   * - 场景2：根据提取的大纲续写
   */
  function createContinueMessages(payload: {
    contextMarkdown: string; // 可为全文或大纲（均为 Markdown）
    style?: string;          // 写作风格
    isOutline?: boolean;  // 是否为大纲驱动
    refs?: string;         // 参考片段
  }) {
    const selectedStyle = allowedStyles.includes(payload.style || '') ? (payload.style as string) : '中性正式';
    const systemContent = `你是一个专业的中文写作助手，负责在不重复已有内容的前提下继续写作。请严格遵守：\n` +
      `1. 仅输出「纯 Markdown 文本」，禁止使用任何代码围栏（如 \`\`\` 或 ~~~）。\n` +
      `2. 严格延续已有内容的结构、语气、术语与格式（标题层级、列表、段落等）。\n` +
      `3. 续写内容要自然衔接，不要复述或改写已有内容。\n` +
      `4. 风格采用「${selectedStyle}」。\n` +
      `5. 可参考提供的片段进行续写，但请不要在输出中标注任何来源、链接或序号。`;
    const refsText = payload.refs ? `\n\n参考片段：\n\n${payload.refs}` : '';
    const userContent = payload.isOutline
      ? `以下是文章大纲（Markdown）。请基于大纲从最后部分自然续写新的内容，注意不要重复大纲中已有的条目，仅输出正文 Markdown（不要标注来源或序号）：\n\n${payload.contextMarkdown}${refsText}`
      : `以下是文章的已写正文（Markdown）。请从文末自然续写新的内容，保持原有结构与格式，不要重复或改写已有部分，仅输出续写的正文 Markdown（不要标注来源或序号）：\n\n${payload.contextMarkdown}${refsText}`;

    return [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent },
    ];
  }
  function selectModel(opts?: { reasoning?: boolean; fallback?: string }) {
    const { reasoning = false, fallback = 'deepseek-chat' } = opts || {};
    return reasoning ? 'deepseek-reasoner' : fallback;
  }

  async function streamChat(params: StreamChatParams) {
    const sessionId = params.sessionId || `chat-${Date.now()}`;
    const model = params.model || 'deepseek-chat';

    // 确保有一个可写入的 chatMessageList（用于 stores/chat 的 processChunk 写入）
    const list = params.chatMessageList || [
      { role: AI_IDENTITY_AI_VALUE, choices: [], loading: true, isSpread: true },
    ];

    let session;
    try {
      session = await chatStore.startChatSession(
        sessionId,
        params.messages as any,
        userStore,
        model,
        params.docs || null,
      );
      if (!session) throw new Error('会话启动失败');
    } catch (error: any) {
      console.error('AI会话启动失败:', error);
      
      // 处理认证失败错误
      if (error.message?.includes('401') || error.message?.includes('认证')) {
        $message.error('认证失败，请检查登录状态或重新登录');
      } else if (error.message?.includes('403')) {
        $message.error('权限不足，无法访问该功能');
      } else if (error.message?.includes('网络') || error.message?.includes('连接')) {
        $message.error('网络连接失败，请检查网络设置');
      } else {
        $message.error(`AI服务暂时不可用: ${error.message || '未知错误'}`);
      }
      
      throw error; // 继续抛出错误让调用方处理
    }

    return new Promise<any[]>((resolve, reject) => {
      const pump = async () => {
        try {
          // 如果被外部请求“暂停”，则停止继续拉取并视为完成（上层可据此在 UI 上展示“已暂停”状态）
          if (aiSessionControl.isPaused(sessionId)) {
            if (params.onDelta) await params.onDelta({ chatMessageList: list, done: true });
            if (params.onDone) await params.onDone({ chatMessageList: list });
            return resolve(list);
          }
          const done = await chatStore.processChatSession(sessionId, list as any);
          if (params.onDelta) await params.onDelta({ chatMessageList: list, done: Boolean(done) });
          if (!done) {
            requestAnimationFrame(pump);
          } else {
            if (params.onDone) await params.onDone({ chatMessageList: list });
            resolve(list);
          }
        } catch (e) {
          reject(e);
        }
      };
      pump();
    });
  }

  async function polishText(text: string, opts?: {
    sessionId?: string;
    model?: string;
    onDelta?: StreamChatParams['onDelta'];
    onDone?: StreamChatParams['onDone'];
  }, style?: string, model?: string) {
    // const messages = [
    //   { role: 'system', content: '你是一个中文写作润色助手。请严格输出「纯 Markdown 文本」，不要使用任何代码围栏（如 ``` 或 ~~~）。保持语义不变，优化逻辑、语法与用词，可适度调整结构。' },
    //   { role: 'user', content: `请对以下内容进行智能润色，并仅输出润色后的内容：\n\n${text}` },
    // ];
    const docs = await fetchKnowledge(text);
    const refs = buildKbRefs(docs);
    const messages = createAIMessages(text, style, '润色', refs);
    return streamChat({
      sessionId: opts?.sessionId,
      messages,
      model: opts?.model || 'deepseek-chat',
      chatMessageList: [ { role: AI_IDENTITY_AI_VALUE, choices: [], loading: true } ],
      onDelta: opts?.onDelta,
      onDone: opts?.onDone,
    });
  }

  /**
   * 基于上下文的 AI 续写
   * @param contextMarkdown 已有内容（或大纲）的 Markdown 文本
   */
  async function continueText(contextMarkdown: string, opts?: {
    sessionId?: string;
    model?: string;
    onDelta?: StreamChatParams['onDelta'];
    onDone?: StreamChatParams['onDone'];
    style?: string;
    isOutline?: boolean;
  }) {
    const docs = await fetchKnowledge(contextMarkdown);
    const refs = buildKbRefs(docs);
    const messages = createContinueMessages({
      contextMarkdown,
      style: opts?.style || '中性正式',
      isOutline: Boolean(opts?.isOutline),
      refs
    });
    return streamChat({
      sessionId: opts?.sessionId,
      messages,
      model: opts?.model || 'deepseek-chat',
      chatMessageList: [ { role: AI_IDENTITY_AI_VALUE, choices: [], loading: true } ],
      onDelta: opts?.onDelta,
      onDone: opts?.onDone,
    });
  }

  return { selectModel, streamChat, polishText, continueText, fetchKnowledge, buildKbRefs, createAIMessages };
}
