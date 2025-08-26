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
import { useChatStore } from '@/stores/chat';
import { useUserStore } from '@/stores/user';
import { useAiChat } from '@/composables/useAiChat';
import { AI_IDENTITY_AI_VALUE } from '@/constant/enum';
import { marked } from 'marked';
import { Textarea as ATextarea, Button as AButton } from 'ant-design-vue';
// Tinymce 组件已全局自动引入，无需手动import
const richText = ref('');
const tinymceRef = ref();
const thinkRef = ref<HTMLElement | null>(null);


// AI Panel state
const tip = ref('');
const len = ref('mid');
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

const chatStore = useChatStore();
const userStore = useUserStore();
const { selectModel, streamChat } = useAiChat();

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
const allowedStyles = ['学术', '公文', '日常', '网络', '科普', '文学', '中性正式'];

/**
 * 构建 AI 消息体
 */
function buildAIMessages(
    text: string,
    style: string = '中性正式',
    mode: 'polish' | 'write' = 'polish',
    options: { len?: 'short' | 'mid' | 'long'; requires?: string[] } = {}
) {
    const selectedStyle = allowedStyles.includes(style) ? style : '中性正式';
    const lenMap: Record<string, string> = { short: '简短', mid: '适中', long: '较长' };
    const reqs = options.requires && options.requires.length ? options.requires.join('、') : '结构清晰、简洁明了、无错别字';

    const systemPrompt = `
        你是一个中文写作助手。
        请严格输出「纯 Markdown 文本」，禁止使用任何代码围栏（如 \`\`\` 或 ~~~），不要附加解释或多余文字。
        保留 Markdown 标准语法，包括标题（#）、小结、列表、加粗、斜体、链接等，同时保持结构清晰。
        当用户要求润色时，请在保持语义不变的前提下优化逻辑、语法与用词，可适度调整结构；
        当用户要求写作时，请根据提示内容创作完整中文文本，逻辑清晰、条理分明，可自动生成标题和小节结构，每段尽量围绕一个核心观点。
        可根据 ${selectedStyle} 参数选择风格：学术、公文、日常、网络、科普、文学、中性正式（默认）。
        `;

    let userPrompt = '';
    if (mode === 'polish') {
        userPrompt = `请以「${selectedStyle}」风格对以下内容进行智能润色，保持原始含义，优化逻辑、语法与用词，可适度调整结构；输出为「纯 Markdown 文本」，禁止使用代码块围栏，不要附加解释或说明：\n\n${text}`;
    } else if (mode === 'write') {
        userPrompt = `请以「${selectedStyle}」风格，严格按照下列“要求”，围绕“意图”创作一段${lenMap[options.len || 'mid']}篇幅的中文内容。请自动生成合适的标题与小节结构；每段围绕一个核心观点；禁止输出任何解释性话语；输出必须为纯 Markdown 文本（不得使用代码块围栏）。\n` +
            `意图：${text}\n` +
            `要求：${reqs}\n` +
            `受众：通用读者。`;
    }

    return [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];
}

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

    // 构造 OpenAI 兼容消息（使用 intent，避免因先清空 input 导致传空）
    const msg = buildAIMessages(
        intent,
        style.value,
        mode.value === 'write' ? 'write' : 'polish',
        { len: len.value as any, requires: reqs }
    );

    // 此时再安全地清空输入框
    input.value = '';

    const sessionId = `richtext-${Date.now()}`;
    const model = selectModel({ reasoning: auto.value, fallback: 'deepseek-chat' });

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
                const html = mdToHtml(content);
                richText.value = mode.value === 'write' ? `${baseBefore}${html}` : html;
                await nextTick();
                if (tinymceRef.value?.scrollToBottom) tinymceRef.value.scrollToBottom();
                if (thinkRef.value) thinkRef.value.scrollTop = thinkRef.value.scrollHeight;
            },
            onDone: async () => {
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