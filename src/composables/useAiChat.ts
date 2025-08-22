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
  }) {
    const messages = [
      { role: 'system', content: '你是一个中文写作润色助手。请严格输出「纯 Markdown 文本」，不要使用任何代码围栏（如 ``` 或 ~~~）。保持语义不变，优化逻辑、语法与用词，可适度调整结构。' },
      { role: 'user', content: `请对以下内容进行智能润色，并仅输出润色后的内容：\n\n${text}` },
    ];
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
