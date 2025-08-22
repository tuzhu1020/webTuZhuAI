<template>
    <div class="w-full h-screen bg-[#f5f7fb]">
        <!-- Top spacer to look airy like the design -->
        <div class="px-[16px] pt-[12px] pb-[12px]">
            <div class="text-[16px] text-[#99a1b2]">无标题文11档</div>
        </div>

        <!-- Main three-column layout -->
        <div class="flex  items-start gap-[12px] px-[12px] pb-[12px]">
            <!-- Left: Rich Text Editor Card -->
            <div
                class="flex-1 h-[calc(100vh-48px)] min-w-0 bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#eef0f5] flex flex-col">
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
                class="w-[360px] h-[calc(100vh-48px)] flex flex-col  shrink-0 bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#eef0f5]">
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
                    <div class="text-[13px] text-[#334155] mb-[8px]">AI 对话</div>
                    <div
                        class="h-[160px] rounded-[6px] border border-[#e5e7eb] p-[8px] overflow-auto text-[12px] text-[#4b5563] bg-[#fcfcfd]">
                        <div v-for="(m,i) in messages" :key="i" class="mb-[6px]">
                            <div class="text-[#6b7280]">{{ m.role === 'user' ? '我' : 'AI' }}</div>
                            <div>{{ m.content }}</div>
                        </div>
                    </div>
                    <!-- 深度思考：展示 reasoning_content 的增量行 -->
                    <div v-if="auto && chatMessageList.length" class="mt-[8px] flex-1 min-h-0 flex flex-col">
                        <div class="text-[12px] text-[#334155] mb-[6px]">思考过程</div>
                        <div
                            ref="thinkRef"
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
                class="w-[72px] h-[calc(100vh-48px)]  shrink-0 bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#eef0f5] flex flex-col items-center py-[10px] gap-[6px]">
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

function buildSystemPrompt() {
  return (
    '你是一个中文写作助手。' +
    '请严格输出「纯 Markdown 文本」，不要使用任何代码围栏（如 ``` 或 ~~~），也不要附加解释。' +
    '结构清晰，允许使用标题（#）、小结、列表、加粗/斜体/链接等标准 Markdown 语法。' +
    '当我要求润色时，请在保持语义不变的前提下优化表达；当我要求写作时，请按要求创作。'
  );
}

function buildUserPrompt() {
  const reqs = requires.value.filter(r => r.checked).map(r => r.label).join('、');
  const lenMap: Record<string, string> = { short: '简短', mid: '适中', long: '较长' };
  if (mode.value === 'polish') {
    return `请对以下内容进行智能润色，保持原始含义，优化逻辑、语法与用词，可适度调整结构；输出为「纯 Markdown」（不要使用代码块围栏）：\n\n${richText.value}`;
  }
  // 写作模式
  return (
    `请根据以下意图生成一段${lenMap[len.value]}篇幅的中文内容，满足要求，并输出为「纯 Markdown」（不要使用代码块围栏）：\n` +
    `意图：${tip.value || input.value}\n` +
    `要求：${reqs || '结构清晰、简洁明了、无错别字'}\n` +
    `受众：通用读者。`
  );
}

async function send() {
  if (!input.value && mode.value === 'write' && !tip.value) return;
  if (sending.value) return;
  sending.value = true;
  const question = input.value || (mode.value === 'write' ? tip.value : '润色当前文稿');
  messages.value.push({ role: 'user', content: question });
  input.value = '';

  // 本次生成前置内容（用于写作时在末尾续写；润色则整体替换）
  const baseBefore = mode.value === 'write' ? richText.value : '';

  // 构造 OpenAI 兼容消息
  const msg = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildUserPrompt() },
  ];

  const sessionId = `richtext-${Date.now()}`;
  // 勾选“深度思考”时切换到 R1 推理模型
  const model = selectModel({ reasoning: auto.value, fallback: 'deepseek-chat' });

  // 用于承接流式增量的伪聊天数组（供 store 写入 choices[0]._content）
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
        // 写作：在原文末尾追加；润色：替换整体
        richText.value = mode.value === 'write' ? `${baseBefore}${html}` : html;
        await nextTick();
        // AI 输出时自动滚动到底部
        if (tinymceRef.value?.scrollToBottom) {
          tinymceRef.value.scrollToBottom();
        }
        // 深度思考面板自动滚动到底部
        if (thinkRef.value) {
          thinkRef.value.scrollTop = thinkRef.value.scrollHeight;
        }
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
