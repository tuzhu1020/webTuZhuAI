import { ref } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useUserStore } from '@/stores/user';
import { AI_IDENTITY_AI_VALUE } from '@/constant/enum';

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

    /**
     * 生成 AI 消息体
     * @param {string} text - 要处理的文本
     * @param {string} style - 写作风格
     * @param {'润色'|'写作'} mode - 模式，润色或智能写作
     * @returns {Array} messages - AI 请求消息数组
     */
    function createAIMessages(text, style = '中性正式', mode = '润色') {
        const selectedStyle = allowedStyles.includes(style) ? style : '中性正式';

        // system 提示词
        const systemContent = `
        你是一个专业的中文写作助手。请严格遵守以下规则：
        1. 输出内容必须是「纯 Markdown 文本」，禁止使用任何代码围栏（如 \`\`\` 或 ~~~）。
        2. 保持原文语义不变，但要优化语法、逻辑、用词与表达流畅度，可适度调整结构使其更自然。
        3. 必须保留 Markdown 格式和排版（如标题、列表、引用等），只润色文字或生成内容，不改变结构。
        4. 禁止添加任何额外说明、解释或多余文字，只输出正文内容。
        5. 根据用户提供的写作风格参数进行处理，若无参数或参数无效则默认采用「中性正式」风格。
        - 学术：用词严谨，逻辑缜密，避免口语化。
        - 公文：简洁规范，客观正式，强调逻辑与权威感。
        - 日常：自然流畅，轻松易懂，贴近日常表达。
        - 网络：轻快活泼，可适度使用流行语。
        - 科普：通俗易懂，适合非专业读者理解。
        - 文学：优美生动，富有表现力，可增加修辞与文采。
        - 中性正式（默认）：保持客观、清晰，不偏向任何特殊语气。
        `;

        // user 提示词，根据模式区分
        let userContent = '';
        if (mode === '润色') {
            userContent = `请以「${selectedStyle}」风格对以下内容进行智能润色，并仅输出润色结果：\n\n${text}`;
        } else if (mode === '写作') {
            userContent = `请以「${selectedStyle}」风格，根据以下主题/要求生成完整中文内容，并仅输出正文 Markdown：\n\n${text}`;
        }

        return [
            { role: 'system', content: systemContent },
            { role: 'user', content: userContent }
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

    const session = await chatStore.startChatSession(
      sessionId,
      params.messages as any,
      userStore,
      model,
      params.docs ?? null,
    );
    if (!session) throw new Error('会话启动失败');

    return new Promise<any[]>((resolve, reject) => {
      const pump = async () => {
        try {
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
  },style?: string ,model?: string) {
    // const messages = [
    //   { role: 'system', content: '你是一个中文写作润色助手。请严格输出「纯 Markdown 文本」，不要使用任何代码围栏（如 ``` 或 ~~~）。保持语义不变，优化逻辑、语法与用词，可适度调整结构。' },
    //   { role: 'user', content: `请对以下内容进行智能润色，并仅输出润色后的内容：\n\n${text}` },
    // ];
    const messages = createAIMessages(text, style, model);
    return streamChat({
      sessionId: opts?.sessionId,
      messages,
      model: opts?.model || 'deepseek-chat',
      chatMessageList: [ { role: AI_IDENTITY_AI_VALUE, choices: [], loading: true } ],
      onDelta: opts?.onDelta,
      onDone: opts?.onDone,
    });
  }

  return { selectModel, streamChat, polishText };
}
