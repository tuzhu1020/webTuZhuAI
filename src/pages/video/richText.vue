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
                class="w-[360px] h-[calc(100vh-48px)] shrink-0 bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#eef0f5]">
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

                <!-- 文案建议 -->
                <div class="px-[12px] py-[12px]">
                    <div class="text-[13px] text-[#334155] mb-[8px]">文案建议</div>
                    <div class="relative">
                        <input v-model="tip" type="text" placeholder="输入您的创作意图，如主题、语境、风格、受众等"
                            class="w-full h-[36px] rounded-[6px] border border-[#e5e7eb] px-[10px] text-[13px] text-[#111827] outline-none focus:(border-[#3b5bfd] ring-2 ring-[#e6ecff])" />
                        <div class="absolute right-[10px] top-[8px] text-[12px] text-[#9ca3af]">{{ tip.length }} / 50
                        </div>
                    </div>
                </div>

                <!-- 文案策略（短/中/长） -->
                <div class="px-[12px]">
                    <div class="text-[13px] text-[#334155] mb-[8px]">文案策略</div>
                    <div class="flex items-center gap-[8px]">
                        <button :class="len==='short' ? activeChip : chip" @click="len='short'">短</button>
                        <button :class="len==='mid' ? activeChip : chip" @click="len='mid'">中</button>
                        <button :class="len==='long' ? activeChip : chip" @click="len='long'">长</button>
                    </div>
                </div>

                <!-- 内容要求（复选） -->
                <div class="px-[12px] mt-[12px]">
                    <div class="text-[13px] text-[#334155] mb-[8px]">内容要求</div>
                    <div class="grid grid-cols-2 gap-[8px]">
                        <label v-for="r in requires" :key="r.key"
                            class="flex items-center gap-[8px] text-[12px] text-[#4b5563]">
                            <input type="checkbox" v-model="r.checked" class="w-[14px] h-[14px]" />
                            <span>{{ r.label }}</span>
                        </label>
                    </div>
                </div>

                <!-- 大纲/结构块/参考 -->
                <div class="px-[12px] mt-[12px] flex flex-col gap-[10px]">
                    <div>
                        <div class="text-[13px] text-[#334155] mb-[6px]">文档大纲</div>
                        <button
                            class="w-full h-[34px] rounded-[6px] border border-[#e5e7eb] text-[13px] text-[#374151] hover:bg-[#f9fafb]">生成大纲</button>
                    </div>
                    <div>
                        <div class="text-[13px] text-[#334155] mb-[6px]">添加结构块</div>
                        <button
                            class="w-full h-[34px] rounded-[6px] border border-[#e5e7eb] text-[13px] text-[#374151] hover:bg-[#f9fafb]">添加结构块</button>
                    </div>
                    <div>
                        <div class="text-[13px] text-[#334155] mb-[6px]">添加内容参考</div>
                        <button
                            class="w-full h-[34px] rounded-[6px] border border-[#e5e7eb] text-[13px] text-[#374151] hover:bg-[#f9fafb]">添加内容参考</button>
                    </div>
                </div>

                <!-- Chat box -->
                <div class="px-[12px] mt-[12px] flex-1">
                    <div class="text-[13px] text-[#334155] mb-[8px]">AI 对话</div>
                    <div
                        class="h-[160px] rounded-[6px] border border-[#e5e7eb] p-[8px] overflow-auto text-[12px] text-[#4b5563] bg-[#fcfcfd]">
                        <div v-for="(m,i) in messages" :key="i" class="mb-[6px]">
                            <div class="text-[#6b7280]">{{ m.role === 'user' ? '我' : 'AI' }}</div>
                            <div>{{ m.content }}</div>
                        </div>
                    </div>
                    <div class="mt-[8px] flex items-center gap-[6px]">
                        <input v-model="input" :disabled="sending" placeholder="向 AI 提问或让其续写"
                            class="flex-1 h-[34px] rounded-[6px] border border-[#e5e7eb] px-[10px] text-[13px] outline-none focus:(border-[#3b5bfd] ring-2 ring-[#e6ecff]) disabled:(bg-[#f3f4f6] cursor-not-allowed)" />
                        <button @click="send" :disabled="sending"
                            class="px-[12px] h-[34px] rounded-[6px] bg-[#3b5bfd] text-white text-[13px] disabled:(opacity-60 cursor-not-allowed)">{{
                            sending ? '生成中...' : '发送' }}</button>
                    </div>
                </div>

                <!-- Bottom actions -->
                <div class="px-[12px] py-[12px] mt-[12px] border-t border-[#eef0f5] flex items-center justify-between">
                    <div class="flex items-center gap-[8px]">
                        <span class="text-[12px] text-[#6b7280]">AI 连续写作</span>
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
import { AI_IDENTITY_AI_VALUE } from '@/constant/enum';
import { marked } from 'marked';
// Tinymce 组件已全局自动引入，无需手动import
const richText = ref('');
const tinymceRef = ref();


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

const chatStore = useChatStore();
const userStore = useUserStore();

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
  const model = 'deepseek-chat';

  // 用于承接流式增量的伪聊天数组（供 store 写入 choices[0]._content）
  const chatMessageList: any[] = [
    { role: AI_IDENTITY_AI_VALUE, choices: [], loading: true },
  ];

  try {
    const session = await chatStore.startChatSession(sessionId, msg as any, userStore, model);
    if (!session) throw new Error('会话启动失败');

    // 持续读取流直到完成
    // 每帧进行一次轮询，避免阻塞 UI
    const pump = async () => {
      const done = await chatStore.processChatSession(sessionId, chatMessageList as any);
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
      if (!done) requestAnimationFrame(pump);
      else {
        messages.value.push({ role: 'assistant', content: '已生成内容，已写入编辑器。' });
        sending.value = false;
      }
    };
    pump();
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
