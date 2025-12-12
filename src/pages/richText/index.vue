<template>
    <div class="w-full h-[calc(100vh-100px)] bg-[#f5f7fb]">
        <!-- Top spacer to look airy like the design -->
        <!-- <div class="px-[16px] pt-[12px] pb-[12px]">
            <div class="text-[16px] text-[#99a1b2]">无标题文11档</div>
        </div> -->

        <!-- Main three-column layout -->
        <div class="flex flex-1 mt-10  items-start gap-[12px] px-[12px] pb-[12px]">
            <!-- Left: Rich Text Editor Card -->
            <div
                class="flex-1 h-[calc(100vh-120px)] min-w-0 bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#eef0f5] flex flex-col">
                <div class="px-[12px] py-[10px] border-b border-[#eef0f5] flex items-center gap-[10px] shrink-0">
                    <div class="i-carbon-text-font text-[18px] text-[#606a78]" />
                    <div class="text-[14px] text-[#606a78]">正文编辑</div>
                </div>
                <div class="px-[12px] py-[12px] flex-1 min-h-0">
                    <!-- Tinymce editor fills available height; internal content scrolls -->
                    <Tinymce ref="tinymceRef" v-model="richText" class="h-full" :height="'100%'" />
                </div>
                <!-- <div class="px-[12px] py-[8px] text-[#99a1b2] text-[12px] border-t border-[#eef0f5] shrink-0">
          以上内容由您创作，仅供参考
        </div> -->
            </div>

            <!-- Middle: AI Panel -->
            <div
                class="w-[360px] h-[calc(100vh-120px)] flex flex-col  shrink-0 bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#eef0f5]">
                <!-- Header segmented options -->
                <div class="px-[12px] pt-[12px] pb-[8px] border-b border-[#eef0f5]">
                    <div class="flex items-center justify-between">
                        <div class="text-[14px] text-[#334155] font-500">写作模式</div>
                        <div class="text-[12px] text-[#99a1b2]">17:07</div>
                    </div>
                    <div class="mt-[10px] flex items-center gap-[8px]">
                        <button :class="mode==='write'? activeChip: chip" @click="mode='write'"
                            class="px-[10px] h-[28px] rounded-[6px] text-[12px]">智能写作</button>
                        <button :class="mode==='polish'? activeChip: chip" @click="mode='polish'"
                            class="px-[10px] h-[28px] rounded-[6px] text-[12px]">智能润色</button>
                    </div>
                    <div class="mt-[8px] flex items-center gap-[8px]">
                        <span class="text-[12px] text-[#6b7280]">目标字数（严格）：</span>
                        <input type="number" min="0" v-model.number="wordLimit" placeholder="如 300"
                            class="w-[100px] h-[28px] px-[8px] rounded-[6px] border border-[#e5e7eb] text-[12px] focus:(outline-none border-[#3b5bfd])" />
                        <span class="text-[11px] text-[#9ca3af]">留空则不限制</span>
                    </div>
                </div>


                <!-- Chat box -->
                <div class="px-[12px] mt-[12px] flex-1 flex flex-col min-h-0">
                    <!-- <div class="text-[13px] text-[#334155] mb-[8px]">AI 对话</div>
                    <div
                        class="h-[160px] rounded-[6px] border border-[#e5e7eb] p-[8px] overflow-auto text-[12px] text-[#4b5563] bg-[#fcfcfd]">
                        <div v-for="(m,i) in messages" :key="i" class="mb-[6px]">
                            <div class="text-[#6b7280]">{{ m.role === 'user' ? '我' : 'AI' }}</div>
                            <div>{{ m.content }}</div>
                        </div>
                    </div> -->
                    <!-- 深度思考：展示 reasoning_content 的增量行 -->
                    <div v-if="auto && chatMessageList.length" class="mt-[8px] flex-1 min-h-0 flex flex-col">
                        <div class="text-[12px] text-[#334155] mb-[6px]">思考过程</div>
                        <div ref="thinkRef"
                            class="flex-1 min-h-0 overflow-y-auto rounded-[6px] border border-[#e5e7eb] p-[8px]  text-[12px] text-[#64748b] bg-[#fafafa]">
                            <p v-for="(line, idx) in (chatMessageList[chatMessageList.length-1]?.choices?.[0]?._thinkContent || [])"
                                :key="idx" class="leading-[1.6] whitespace-pre-wrap ">{{ line }}</p>
                        </div>
                    </div>
                    <div class="mt-[8px] flex flex-col  gap-[6px]">
                        <ATextarea v-model:value="input" placeholder="给 DeepSeek 输入" autofocus
                            :autoSize="{ minRows: 2, maxRows: 10 }"
                            class="max-w-full! min-w-full! w-full! resize-none!  bg-transparent! text-16! " />
                        <button @click="send" :disabled="sending"
                            class="px-[12px] h-[34px] rounded-[6px] bg-[#3b5bfd] text-white text-[13px] disabled:(opacity-60 cursor-not-allowed)">{{
                            sending ? '生成中...' : '发送' }}</button>
                    </div>
                </div>

                <!-- Bottom actions -->
                <div class="px-[12px] py-[12px] mt-[12px] border-t border-[#eef0f5] flex items-center justify-between">
                    <div class="flex items-center gap-[8px]">
                        <span class="text-[12px] text-[#6b7280]">深度思考：</span>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" v-model="auto" />
                            <div
                                class="w-[40px] h-[22px] bg-[#e5e7eb] rounded-[999px] peer-checked:bg-[#3b5bfd] transition-colors">
                            </div>
                            <div
                                class="absolute w-[18px] h-[18px] bg-white rounded-[999px] left-[2px] top-[2px] transition-all peer-checked:left-[20px]">
                            </div>
                        </label>
                    </div>
                    <div class="flex items-center gap-[8px]">
                        <button
                            class="px-[12px] h-[34px] rounded-[6px] border border-[#e5e7eb] text-[13px] text-[#374151]">生成大纲</button>
                        <button
                            class="px-[12px] h-[34px] rounded-[6px] bg-[#16a34a] text-white text-[13px]">生成全文</button>
                    </div>
                </div>
            </div>

            <!-- Right: Slim Menu -->
            <div
                class="w-[72px] h-[calc(100vh-120px)]  shrink-0 bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#eef0f5] flex flex-col items-center py-[10px] gap-[6px]">
                <MenuItem label="提纲" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, defineComponent, h, nextTick } from 'vue';
// 页面无需直接访问 chat/user stores
import { useAiChat } from '@/composables/useAiChat';
import { AI_IDENTITY_AI_VALUE } from '@/constant/enum';
import { marked } from 'marked';
import { Textarea as ATextarea } from 'ant-design-vue';
// 知识库查询由 useAiChat 提供的 fetchKnowledge 封装，无需直接引入服务
// Tinymce 组件已全局自动引入，无需手动import
const richText = ref('');
const tinymceRef = ref();
const thinkRef = ref<HTMLElement | null>(null);
// 记录最新的 Markdown 增量（未转换为 HTML），用于严格字数校验与二次微调
const latestMarkdown = ref<string>('');


// AI Panel state
const tip = ref('');
const len = ref('mid');
const wordLimit = ref<number | null>(null);
// 记录本次生成使用的参考与目标，便于后续严格字数微调
const lastRefs = ref<string>('');
const lastWordLimit = ref<number | null>(null);
const requires = ref([
  { key: 'logic', label: '结构清晰', checked: true },
  { key: 'tone', label: '语气正式', checked: false },
  { key: 'short', label: '简洁明了', checked: true },
  { key: 'data', label: '数据充分', checked: false },
  { key: 'noTypos', label: '无错别字', checked: true },
  { key: 'cite', label: '引用规范', checked: false },
]);

const messages = ref([{ role: 'assistant', content: '您好，我是 AI 助手，告诉我需要写什么吧。' }]);
const input = ref('');
const auto = ref(false);
const mode = ref<'write' | 'polish'>('write');
const sending = ref(false);
// 写作/润色风格（传入 buildAIMessages 的第二个参数）
const style = ref<'学术' | '公文' | '日常' | '网络' | '科普' | '文学' | '中性正式'>('中性正式');
// 用于接收 SSE 增量（含 reasoning_content）
const chatMessageList = ref<any[]>([]);

// 已通过 useAiChat 组合式封装会话逻辑
const { selectModel, streamChat, fetchKnowledge, buildKbRefs, createAIMessages } = useAiChat();

// 将纯文本增量转换为基础 HTML（保持段落/换行）
// 将 Markdown 流式增量转换成 HTML，保留加粗/斜体/标题/列表等样式
function mdToHtml(markdown: string) {
  if (!markdown) return '';
  marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: false,
    mangle: false,
  });
  // 直接使用 marked 解析为 HTML。TinyMCE 可直接渲染这些基础块级与行内元素
  return marked.parse(markdown) as string;
}

// 估算 HTML 可见文本长度（去标签与空白）
function htmlVisibleLength(html: string): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]+>/g, '');
  return text.replace(/\s/g, '').length;
}

// 去除 Markdown 语法标记，仅保留可见正文文字
function stripMarkdown(md: string): string {
  if (!md) return '';
  let s = md;
  // 代码块
  s = s.replace(/```[\s\S]*?```/g, '');
  // 行内代码
  s = s.replace(/`[^`]*`/g, '');
  // 图片 ![alt](url)
  s = s.replace(/!\[[^\]]*\]\([^\)]*\)/g, '');
  // 链接 [text](url) -> text
  s = s.replace(/\[([^\]]+)\]\([^\)]*\)/g, '$1');
  // 标题前缀 #, ##, ...
  s = s.replace(/^\s{0,3}#{1,6}\s+/gm, '');
  // 引用前缀 >
  s = s.replace(/^\s*>\s?/gm, '');
  // 列表项前缀 - * + 或 数字.
  s = s.replace(/^\s*[-*+]\s+/gm, '');
  s = s.replace(/^\s*\d+\.\s+/gm, '');
  // 粗斜体标记 ** * __ _
  s = s.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');
  // 表格分隔线和管道
  s = s.replace(/^\s*\|?\s*-{2,}.*$/gm, '');
  s = s.replace(/\|/g, ' ');
  // 移除多余空白
  s = s.replace(/\r?\n+/g, '\n');
  return s.trim();
}

function visibleTextLength(md: string): number {
  const plain = stripMarkdown(md);
  return plain.replace(/\s/g, '').length; // 去空白，仅统计可见字符
}

// function buildSystemPrompt() {
//   return (
//     '你是一个中文写作助手。' +
//     '请严格输出「纯 Markdown 文本」，不要使用任何代码围栏（如 ``` 或 ~~~），也不要附加解释。' +
//     '结构清晰，允许使用标题（#）、小结、列表、加粗/斜体/链接等标准 Markdown 语法。' +
//     '当我要求润色时，请在保持语义不变的前提下优化表达；当我要求写作时，请按要求创作。'
//   );
// }

// function buildUserPrompt() {
//   const reqs = requires.value.filter(r => r.checked).map(r => r.label).join('、');
//   const lenMap: Record<string, string> = { short: '简短', mid: '适中', long: '较长' };
//   if (mode.value === 'polish') {
//     return `请对以下内容进行智能润色，保持原始含义，优化逻辑、语法与用词，可适度调整结构；输出为「纯 Markdown」（不要使用代码块围栏）：\n\n${richText.value}`;
//   }
//   // 写作模式
//   return (
//     `请根据以下意图生成一段${lenMap[len.value]}篇幅的中文内容，满足要求，并输出为「纯 Markdown」（不要使用代码块围栏）：\n` +
//     `意图：${tip.value || input.value}\n` +
//     `要求：${reqs || '结构清晰、简洁明了、无错别字'}\n` +
//     `受众：通用读者。`
//   );
// }
// 使用 composable 中已实现的工具方法（移除本地重复实现）

/**
 * 发送消息
 */
async function send() {
    if (!input.value && mode.value === 'write' && !tip.value) return;
    if (sending.value) return;
    sending.value = true;

    // 先得到本次要用的意图/文本，避免清空 input 后取不到
    const intent = mode.value === 'write' ? (tip.value || input.value) : richText.value;

    const question = input.value || (mode.value === 'write' ? tip.value : '润色当前文稿');
    messages.value.push({ role: 'user', content: question });

    // 本次生成前置内容（用于写作时在末尾续写；润色则整体替换）
    const baseBefore = mode.value === 'write' ? richText.value : '';

    // 获取用户选择的额外要求
    const reqs = requires.value.filter(r => r.checked).map(r => r.label);

    // 查询知识库并构造参考片段（当已有正文很长时，复用上次 refs，避免重复检索）
    let refs = '';
    const longContext = htmlVisibleLength(richText.value) > 1500; // 阈值可根据需要调整
    if (longContext && lastRefs.value) {
      refs = lastRefs.value;
    } else {
      const docs = await fetchKnowledge(intent);
      refs = buildKbRefs(docs);
      lastRefs.value = refs;
    }

    // 构造 OpenAI 兼容消息（使用 intent，避免因先清空 input 导致传空）
    const lenMap: Record<string, string> = { short: '简短', mid: '适中', long: '较长' };
    // 直接复用 composable 内的消息构建：中文模式名适配
    const msg = createAIMessages(
        intent,
        style.value,
        mode.value === 'write' ? '写作' : '润色',
        refs,
        { len: len.value as any, requires: reqs, wordLimit: wordLimit.value || undefined, strictWordLimit: Boolean(wordLimit.value && mode.value === 'write') }
    );

    // 此时再安全地清空输入框
    input.value = '';
    lastWordLimit.value = wordLimit.value ?? null;

    const sessionId = `richtext-${Date.now()}`;
    const model = selectModel({ reasoning: auto.value, fallback: 'gpt-4o-mini-ca' });

    // 初始化聊天消息列表
    chatMessageList.value = [
        { role: AI_IDENTITY_AI_VALUE, choices: [], loading: true, isSpread: true },
    ];

    try {
        await streamChat({
            sessionId,
            messages: msg as any,
            model,
            chatMessageList: chatMessageList.value,
            onDelta: async ({ chatMessageList }) => {
                const last = chatMessageList[chatMessageList.length - 1];
                const content = last?.choices?.[0]?._content || '';
                latestMarkdown.value = content;
                const html = mdToHtml(content);
                richText.value = mode.value === 'write' ? `${baseBefore}${html}` : html;
                await nextTick();
                if (tinymceRef.value?.scrollToBottom) tinymceRef.value.scrollToBottom();
                if (thinkRef.value) thinkRef.value.scrollTop = thinkRef.value.scrollHeight;
            },
            onDone: async () => {
                // 首次完成后若启用严格字数，则进行一次自动微调
                const target = lastWordLimit.value;
                if (mode.value === 'write' && target && target > 0) {
                  const count = visibleTextLength(latestMarkdown.value);
                  if (count !== target) {
                    // 触发一次“严格到 X 字”的调整请求，复用上次 refs，不再检索知识库
                    const adjustSystem = '你是一个中文写作助手。只输出纯 Markdown 正文，不得包含任何解释性话语或道歉。';
                    const action = count > target ? '精简' : '扩展';
                    const adjustUser = `以下是已生成的正文（Markdown）。请在不改变核心论点与总体结构的前提下，将其${action}到严格为 ${target} 字（±0）。\n` +
                      `- 字数统计仅计算可见正文文字，不计入 Markdown 标记符号。\n` +
                      `- 若可能超出，请自行删减；若不足，请补充内容使总字数恰为 ${target}。\n` +
                      `- 禁止输出任何说明或附加话语。\n\n` +
                      `${lastRefs.value ? '可适度参考以下片段，但不要在输出中标注任何来源或序号：\n\n' + lastRefs.value + '\n\n' : ''}` +
                      `正文：\n\n${latestMarkdown.value}`;

                    await streamChat({
                      sessionId: `richtext-adjust-${Date.now()}`,
                      messages: [
                        { role: 'system', content: adjustSystem },
                        { role: 'user', content: adjustUser },
                      ] as any,
                      model,
                      chatMessageList: chatMessageList.value,
                      onDelta: async ({ chatMessageList }) => {
                        const last = chatMessageList[chatMessageList.length - 1];
                        const content = last?.choices?.[0]?._content || '';
                        latestMarkdown.value = content;
                        const html = mdToHtml(content);
                        richText.value = html;
                        await nextTick();
                        if (tinymceRef.value?.scrollToBottom) tinymceRef.value.scrollToBottom();
                        if (thinkRef.value) thinkRef.value.scrollTop = thinkRef.value.scrollHeight;
                      },
                      onDone: async () => {
                        const finalCount = visibleTextLength(latestMarkdown.value);
                        messages.value.push({ role: 'assistant', content: `已按目标字数调整完成（${finalCount}/${target}）` });
                        sending.value = false;
                      },
                    });
                    return; // 提前结束，避免再次设置 sending=false
                  }
                }
                messages.value.push({ role: 'assistant', content: '已生成内容，已写入编辑器。' });
                sending.value = false;
            },
        });
    } catch (e) {
        console.error(e);
        messages.value.push({ role: 'assistant', content: '生成失败，请重试。' });
        sending.value = false;
    }
}


const chip =
  'px-[10px] h-[28px] rounded-[6px] bg-[#f3f4f6] text-[#4b5563] text-[12px] hover:bg-[#e5e7eb]';
const activeChip =
  'px-[10px] h-[28px] rounded-[6px] bg-[#edf2ff] text-[#3b5bfd] text-[12px] border border-[#c7d2fe]';

// Local MenuItem component (functional, no JSX required)
const MenuItem = defineComponent({
  name: 'MenuItem',
  props: { label: { type: String, required: true } },
  setup(props) {
    return () =>
      h(
        'button',
        {
          class:
            'w-[56px] h-[56px] rounded-[10px] border border-[#eef0f5] bg-white hover:bg-[#f8fafc] text-[#475569] text-[12px] flex items-center justify-center text-center px-[6px]',
        },
        props.label,
      );
  },
});
</script>
<route lang="yaml">
meta:
  layout: richText
  requiresAuth: false
</route>