<template>
  <div class="w-full h-full bg-[#f5f7fb]">
    <!-- Top spacer to look airy like the design -->
    <div class="px-[16px] pt-[12px] pb-[12px]">
      <div class="text-[16px] text-[#99a1b2]">无标题文11档</div>
    </div>

    <!-- Main three-column layout -->
    <div class="flex items-start gap-[12px] px-[12px] pb-[12px]">
      <!-- Left: Rich Text Editor Card -->
      <div class="flex-1 min-w-0 bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#eef0f5]">
        <div class="px-[12px] py-[10px] border-b border-[#eef0f5] flex items-center gap-[10px]">
          <div class="i-carbon-text-font text-[18px] text-[#606a78]" />
          <div class="text-[14px] text-[#606a78]">正文编辑</div>
        </div>
        <div class="px-[12px] py-[12px]">
          <!-- Tinymce editor, height matches visual proportion -->
          <Tinymce v-model="richText" :init="tinymceInit" />
        </div>
        <div class="px-[12px] py-[8px] text-[#99a1b2] text-[12px] border-t border-[#eef0f5]">
          以上内容由您创作，仅供参考
        </div>
      </div>

      <!-- Middle: AI Panel -->
      <div class="w-[360px] shrink-0 bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#eef0f5]">
        <!-- Header segmented options -->
        <div class="px-[12px] pt-[12px] pb-[8px] border-b border-[#eef0f5]">
          <div class="flex items-center justify-between">
            <div class="text-[14px] text-[#334155] font-500">写作模式</div>
            <div class="text-[12px] text-[#99a1b2]">17:07</div>
          </div>
          <div class="mt-[10px] flex items-center gap-[8px]">
            <button class="px-[10px] h-[28px] rounded-[6px] bg-[#edf2ff] text-[#3b5bfd] text-[12px]">法定公文</button>
            <button class="px-[10px] h-[28px] rounded-[6px] bg-[#f3f4f6] text-[#4b5563] text-[12px]">稿约文本</button>
            <button class="px-[10px] h-[28px] rounded-[6px] bg-[#f3f4f6] text-[#4b5563] text-[12px]">电商文案</button>
          </div>
        </div>

        <!-- 文案建议 -->
        <div class="px-[12px] py-[12px]">
          <div class="text-[13px] text-[#334155] mb-[8px]">文案建议</div>
          <div class="relative">
            <input
              v-model="tip"
              type="text"
              placeholder="输入您的创作意图，如主题、语境、风格、受众等"
              class="w-full h-[36px] rounded-[6px] border border-[#e5e7eb] px-[10px] text-[13px] text-[#111827] outline-none focus:(border-[#3b5bfd] ring-2 ring-[#e6ecff])"
            />
            <div class="absolute right-[10px] top-[8px] text-[12px] text-[#9ca3af]">{{ tip.length }} / 50</div>
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
            <label v-for="r in requires" :key="r.key" class="flex items-center gap-[8px] text-[12px] text-[#4b5563]">
              <input type="checkbox" v-model="r.checked" class="w-[14px] h-[14px]" />
              <span>{{ r.label }}</span>
            </label>
          </div>
        </div>

        <!-- 大纲/结构块/参考 -->
        <div class="px-[12px] mt-[12px] flex flex-col gap-[10px]">
          <div>
            <div class="text-[13px] text-[#334155] mb-[6px]">文档大纲</div>
            <button class="w-full h-[34px] rounded-[6px] border border-[#e5e7eb] text-[13px] text-[#374151] hover:bg-[#f9fafb]">生成大纲</button>
          </div>
          <div>
            <div class="text-[13px] text-[#334155] mb-[6px]">添加结构块</div>
            <button class="w-full h-[34px] rounded-[6px] border border-[#e5e7eb] text-[13px] text-[#374151] hover:bg-[#f9fafb]">添加结构块</button>
          </div>
          <div>
            <div class="text-[13px] text-[#334155] mb-[6px]">添加内容参考</div>
            <button class="w-full h-[34px] rounded-[6px] border border-[#e5e7eb] text-[13px] text-[#374151] hover:bg-[#f9fafb]">添加内容参考</button>
          </div>
        </div>

        <!-- Chat box -->
        <div class="px-[12px] mt-[12px]">
          <div class="text-[13px] text-[#334155] mb-[8px]">AI 对话</div>
          <div class="h-[160px] rounded-[6px] border border-[#e5e7eb] p-[8px] overflow-auto text-[12px] text-[#4b5563] bg-[#fcfcfd]">
            <div v-for="(m,i) in messages" :key="i" class="mb-[6px]">
              <div class="text-[#6b7280]">{{ m.role === 'user' ? '我' : 'AI' }}</div>
              <div>{{ m.content }}</div>
            </div>
          </div>
          <div class="mt-[8px] flex items-center gap-[6px]">
            <input v-model="input" placeholder="向 AI 提问或让其续写" class="flex-1 h-[34px] rounded-[6px] border border-[#e5e7eb] px-[10px] text-[13px] outline-none focus:(border-[#3b5bfd] ring-2 ring-[#e6ecff])" />
            <button @click="send" class="px-[12px] h-[34px] rounded-[6px] bg-[#3b5bfd] text-white text-[13px]">发送</button>
          </div>
        </div>

        <!-- Bottom actions -->
        <div class="px-[12px] py-[12px] mt-[12px] border-t border-[#eef0f5] flex items-center justify-between">
          <div class="flex items-center gap-[8px]">
            <span class="text-[12px] text-[#6b7280]">AI 连续写作</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" v-model="auto" />
              <div class="w-[40px] h-[22px] bg-[#e5e7eb] rounded-[999px] peer-checked:bg-[#3b5bfd] transition-colors"></div>
              <div class="absolute w-[18px] h-[18px] bg-white rounded-[999px] left-[2px] top-[2px] transition-all peer-checked:left-[20px]"></div>
            </label>
          </div>
          <div class="flex items-center gap-[8px]">
            <button class="px-[12px] h-[34px] rounded-[6px] border border-[#e5e7eb] text-[13px] text-[#374151]">生成大纲</button>
            <button class="px-[12px] h-[34px] rounded-[6px] bg-[#16a34a] text-white text-[13px]">生成全文</button>
          </div>
        </div>
      </div>

      <!-- Right: Slim Menu -->
      <div class="w-[72px] shrink-0 bg-white rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#eef0f5] flex flex-col items-center py-[10px] gap-[6px]">
        <MenuItem label="提纲" />
        <MenuItem label="润色" />
        <MenuItem label="改写" />
        <MenuItem label="续写" />
        <MenuItem label="总结" />
        <div class="mt-[6px] w-[48px] h-[1px] bg-[#eef0f5]" />
        <MenuItem label="导出" />
        <MenuItem label="分享" />
        <MenuItem label="设置" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineComponent, h } from 'vue';
// Tinymce 组件已全局自动引入，无需手动import
const richText = ref('');

// TinyMCE 自托管初始化（本地开发不校验 key，不加载云端插件）
const tinymceInit = {
  height: 520,
  menubar: true,
  // 自托管路径（对应 public/tinymce/）
  base_url: '/tinymce',
  suffix: '.min',
  language: 'zh_CN',
  language_url: '/tinymce/tinymce-i18n/langs8/zh_CN.js',
  license_key: 'gpl',
  api_key: null,
  toolbar:
    'undo redo | blocks fontfamily fontsize | bold italic underline forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | image link table code | removeformat',
  plugins: 'lists link image table code',
};

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

function send() {
  if (!input.value) return;
  messages.value.push({ role: 'user', content: input.value });
  // 简单回显，后续可接入真实后端
  setTimeout(() => {
    messages.value.push({ role: 'assistant', content: '已收到：' + input.value + '，我会根据您的要求进行优化。' });
  }, 300);
  input.value = '';
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
