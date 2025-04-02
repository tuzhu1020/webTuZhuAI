<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { useRoute } from "vue-router";
import { message } from "ant-design-vue";

const route = useRoute();
const videoId = ref(Number(route.params.id));

// 模拟视频详情数据
const videoDetail = reactive({
  id: videoId.value,
  title: "前端开发实用技巧分享",
  author: "李四",
  avatar: "/default_avatar.svg",
  views: "1.8万",
  likes: "3.2千",
  coins: "1.5千",
  favorites: "849",
  shares: "532",
  publishTime: "2023-12-15",
  description:
    "本视频分享了前端开发中的实用技巧，包括Vue3+TypeScript的使用方法、性能优化技巧以及常见问题的解决方案。希望对大家的学习和工作有所帮助！",
  tags: ["前端开发", "Vue3", "TypeScript", "性能优化"],
});

// 弹幕相关
const bulletScreen = ref("");
const danmakuPool = ref([
  {
    id: 1,
    text: "这个讲解太清晰了！",
    time: 2,
    color: "#fff",
    size: "normal",
    position: "scroll",
  },
  {
    id: 2,
    text: "学到了很多，感谢UP主",
    time: 5,
    color: "#fff",
    size: "normal",
    position: "scroll",
  },
  {
    id: 3,
    text: "前端开发必看教程",
    time: 8,
    color: "#fff",
    size: "normal",
    position: "scroll",
  },
  {
    id: 4,
    text: "这个技巧太有用了",
    time: 12,
    color: "#0f0",
    size: "large",
    position: "scroll",
  },
  {
    id: 5,
    text: "求更多Vue3+TS的教程",
    time: 15,
    color: "#fff",
    size: "normal",
    position: "scroll",
  },
  {
    id: 6,
    text: "收藏了！以后慢慢学习",
    time: 20,
    color: "#fff",
    size: "normal",
    position: "scroll",
  },
]);

// 弹幕颜色选项
const colorOptions = ref([
  { value: "#ffffff", label: "白色" },
  { value: "#fe0302", label: "红色" },
  { value: "#00cd00", label: "绿色" },
  { value: "#0000fe", label: "蓝色" },
  { value: "#ffff00", label: "黄色" },
  { value: "#fe98ff", label: "粉色" },
  { value: "#00ffff", label: "青色" },
]);

// 弹幕设置
const danmakuSettings = reactive({
  color: "#ffffff",
  size: "normal", // normal, small, large
  position: "scroll", // scroll, top, bottom
  opacity: 1,
  fontSize: 24,
});

// 是否显示弹幕
const showDanmaku = ref(true);

// 播放状态
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(180); // 假设视频长度3分钟
const videoProgress = ref(0);

// 弹幕显示区域尺寸
const danmakuContainerRef = ref(null);

// 视频控制
const togglePlay = () => {
  isPlaying.value = !isPlaying.value;
};

// 发送弹幕
const sendDanmaku = () => {
  if (!bulletScreen.value.trim()) {
    message.warning("弹幕内容不能为空");
    return;
  }

  const newDanmaku = {
    id: danmakuPool.value.length + 1,
    text: bulletScreen.value,
    time: Math.floor(currentTime.value),
    color: danmakuSettings.color,
    size: danmakuSettings.size,
    position: danmakuSettings.position,
  };

  danmakuPool.value.push(newDanmaku);
  bulletScreen.value = "";
  message.success("弹幕发送成功");
};

// 随机生成弹幕轨道位置
const getRandomTrack = () => {
  return Math.floor(Math.random() * 15) * 30;
};

// 模拟播放进度
onMounted(() => {
  setInterval(() => {
    if (isPlaying.value) {
      currentTime.value += 0.1;
      if (currentTime.value >= duration.value) {
        currentTime.value = 0;
      }
      videoProgress.value = (currentTime.value / duration.value) * 100;
    }
  }, 100);
});

// 视频相关操作
const likeVideo = () => message.success("点赞成功");
const coinVideo = () => message.success("投币成功");
const favoriteVideo = () => message.success("收藏成功");
const shareVideo = () => message.success("分享成功");
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-20">
    <div class="max-w-1200 mx-auto px-4">
      <!-- 视频播放区域 -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden mb-5">
        <div class="relative">
          <!-- 视频播放器 -->
          <div class="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
            <!-- 模拟视频播放界面 -->
            <div v-if="!isPlaying" class="absolute inset-0 flex items-center justify-center z-10">
              <button @click="togglePlay" class="text-white bg-black/50 rounded-full p-16 hover:bg-black/70 transition-colors">
                <i class="i-tabler-player-play text-48"></i>
              </button>
            </div>

            <!-- 弹幕显示区域 -->
            <div v-if="showDanmaku" ref="danmakuContainerRef" class="absolute inset-0 overflow-hidden pointer-events-none">
              <div v-for="danmaku in danmakuPool" :key="danmaku.id" :style="{
                  color: danmaku.color,
                  top: `${getRandomTrack()}px`,
                  animationDelay: `${danmaku.time * 0.1}s`,
                  fontSize: danmaku.size === 'large' ? '28px' : danmaku.size === 'small' ? '16px' : '22px',
                }" class="absolute whitespace-nowrap animate-danmaku">
                {{ danmaku.text }}
              </div>
            </div>

            <!-- 模拟视频内容 -->
            <span v-if="isPlaying" class="text-white text-24">视频播放中...</span>
            <span v-else class="text-white text-24">点击播放</span>
          </div>

          <!-- 视频控制栏 -->
          <div class="bg-gray-900 p-3 text-white flex flex-col">
            <!-- 进度条 -->
            <div class="flex items-center mb-2">
              <button @click="togglePlay" class="mr-2">
                <i :class="isPlaying ? 'i-tabler-player-pause' : 'i-tabler-player-play'"></i>
              </button>
              <div class="h-3 bg-gray-700 rounded-full flex-1 cursor-pointer">
                <div class="h-full bg-red-500 rounded-full" :style="{ width: `${videoProgress}%` }"></div>
              </div>
              <span class="ml-2 text-14">{{ Math.floor(currentTime / 60) }}:{{ (Math.floor(currentTime) % 60).toString().padStart(2, '0') }} / {{ Math.floor(duration / 60) }}:{{ (duration % 60).toString().padStart(2, '0') }}</span>
            </div>

            <!-- 控制按钮组 -->
            <div class="flex justify-between items-center">
              <div class="flex space-x-4">
                <button>
                  <i class="i-tabler-volume"></i>
                </button>
                <button>
                  <i class="i-tabler-settings"></i>
                </button>
                <div class="flex items-center">
                  <span class="text-14 mr-2">弹幕</span>
                  <button @click="showDanmaku = !showDanmaku" class="relative">
                    <div class="w-36 h-18 bg-gray-700 rounded-full"></div>
                    <div class="absolute top-1 h-16 w-16 rounded-full transition-all duration-300" :class="showDanmaku ? 'bg-blue-500 right-1' : 'bg-gray-400 left-1'"></div>
                  </button>
                </div>
              </div>
              <div>
                <button>
                  <i class="i-tabler-picture-in-picture"></i>
                </button>
                <button class="ml-3">
                  <i class="i-tabler-arrows-maximize"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 视频信息与交互区域 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <!-- 左侧视频信息 -->
        <div class="md:col-span-2">
          <!-- 视频标题和数据 -->
          <div class="bg-white rounded-xl shadow-sm p-5 mb-5">
            <h1 class="text-24 font-bold mb-3">{{ videoDetail.title }}</h1>
            <div class="text-gray-500 text-14 mb-4">
              {{ videoDetail.views }}次观看 · {{ videoDetail.publishTime }}
            </div>

            <!-- 视频介绍 -->
            <div class="text-gray-700 mb-4">
              {{ videoDetail.description }}
            </div>

            <!-- 标签 -->
            <div class="flex flex-wrap gap-2">
              <span v-for="(tag, index) in videoDetail.tags" :key="index" class="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-12">
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- UP主信息 -->
          <div class="bg-white rounded-xl shadow-sm p-5 mb-5 flex justify-between items-center">
            <div class="flex items-center">
              <img :src="videoDetail.avatar" alt="UP主头像" class="w-48 h-48 rounded-full">
              <div class="ml-3">
                <div class="font-medium text-18">{{ videoDetail.author }}</div>
                <div class="text-gray-500 text-14">3.2万 粉丝</div>
              </div>
            </div>
            <button class="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full transition-colors">
              + 关注
            </button>
          </div>

          <!-- 评论区 -->
          <div class="bg-white rounded-xl shadow-sm p-5">
            <h3 class="text-18 font-bold mb-4">评论区</h3>
            <div class="flex mb-4">
              <img src="@/assets/images/default_avatar.svg" alt="用户头像" class="w-40 h-40 rounded-full mr-3">
              <div class="flex-1">
                <textarea placeholder="发一条友善的评论" class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows="2"></textarea>
                <div class="flex justify-end mt-2">
                  <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-lg transition-colors">
                    发布评论
                  </button>
                </div>
              </div>
            </div>

            <!-- 评论列表占位 -->
            <div class="text-center py-10 text-gray-500">
              暂无评论，快来发表你的看法吧！
            </div>
          </div>
        </div>

        <!-- 右侧推荐视频 -->
        <div class="md:col-span-1">
          <!-- 互动栏 -->
          <div class="bg-white rounded-xl shadow-sm p-4 mb-5">
            <div class="flex justify-between text-center">
              <div class="flex-1 flex flex-col items-center cursor-pointer" @click="likeVideo">
                <i class="i-tabler-thumb-up text-24 mb-1"></i>
                <span class="text-14">{{ videoDetail.likes }}</span>
              </div>
              <div class="flex-1 flex flex-col items-center cursor-pointer" @click="coinVideo">
                <i class="i-tabler-coin text-24 mb-1"></i>
                <span class="text-14">{{ videoDetail.coins }}</span>
              </div>
              <div class="flex-1 flex flex-col items-center cursor-pointer" @click="favoriteVideo">
                <i class="i-tabler-star text-24 mb-1"></i>
                <span class="text-14">{{ videoDetail.favorites }}</span>
              </div>
              <div class="flex-1 flex flex-col items-center cursor-pointer" @click="shareVideo">
                <i class="i-tabler-share text-24 mb-1"></i>
                <span class="text-14">{{ videoDetail.shares }}</span>
              </div>
            </div>
          </div>

          <!-- 弹幕发送区 -->
          <div class="bg-white rounded-xl shadow-sm p-4 mb-5">
            <h3 class="text-16 font-bold mb-3">发送弹幕</h3>
            <div class="flex mb-3">
              <input v-model="bulletScreen" type="text" placeholder="发送弹幕..." class="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <button @click="sendDanmaku" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg transition-colors">
                发送
              </button>
            </div>

            <!-- 弹幕设置 -->
            <div class="bg-gray-50 rounded-lg p-3">
              <h4 class="text-14 font-medium mb-2">弹幕设置</h4>

              <!-- 颜色选择 -->
              <div class="mb-2">
                <div class="text-14 mb-1">颜色：</div>
                <div class="flex flex-wrap gap-2">
                  <div v-for="option in colorOptions" :key="option.value" @click="danmakuSettings.color = option.value" :class="{'ring-2 ring-blue-500': danmakuSettings.color === option.value}" class="w-20 h-20 rounded-full cursor-pointer" :style="{ backgroundColor: option.value }" :title="option.label"></div>
                </div>
              </div>

              <!-- 大小选择 -->
              <div class="mb-2">
                <div class="text-14 mb-1">大小：</div>
                <div class="flex space-x-2">
                  <button @click="danmakuSettings.size = 'small'" :class="{'bg-blue-500 text-white': danmakuSettings.size === 'small'}" class="px-3 py-1 text-12 border border-gray-300 rounded-lg">
                    小
                  </button>
                  <button @click="danmakuSettings.size = 'normal'" :class="{'bg-blue-500 text-white': danmakuSettings.size === 'normal'}" class="px-3 py-1 text-14 border border-gray-300 rounded-lg">
                    中
                  </button>
                  <button @click="danmakuSettings.size = 'large'" :class="{'bg-blue-500 text-white': danmakuSettings.size === 'large'}" class="px-3 py-1 text-16 border border-gray-300 rounded-lg">
                    大
                  </button>
                </div>
              </div>

              <!-- 位置选择 -->
              <div>
                <div class="text-14 mb-1">位置：</div>
                <div class="flex space-x-2">
                  <button @click="danmakuSettings.position = 'scroll'" :class="{'bg-blue-500 text-white': danmakuSettings.position === 'scroll'}" class="px-3 py-1 border border-gray-300 rounded-lg">
                    滚动
                  </button>
                  <button @click="danmakuSettings.position = 'top'" :class="{'bg-blue-500 text-white': danmakuSettings.position === 'top'}" class="px-3 py-1 border border-gray-300 rounded-lg">
                    顶部
                  </button>
                  <button @click="danmakuSettings.position = 'bottom'" :class="{'bg-blue-500 text-white': danmakuSettings.position === 'bottom'}" class="px-3 py-1 border border-gray-300 rounded-lg">
                    底部
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 推荐视频列表 -->
          <div class="bg-white rounded-xl shadow-sm p-4">
            <h3 class="text-16 font-bold mb-3">相关推荐</h3>
            <div class="space-y-3">
              <div v-for="i in 5" :key="i" class="flex cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                <div class="w-120 h-70 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                  <span class="text-24">🎬</span>
                </div>
                <div class="flex-1">
                  <div class="text-14 font-medium mb-1 line-clamp-2">Vue3 与 TypeScript 结合使用最佳实践</div>
                  <div class="text-12 text-gray-500">王五</div>
                  <div class="text-12 text-gray-500">3.2万次观看</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-danmaku {
  animation: danmaku 15s linear forwards;
  position: absolute;
  left: 100%;
  transform: translateX(0);
  white-space: nowrap;
}

@keyframes danmaku {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-200%);
  }
}
</style>

<route lang="yaml">
meta:
  layout: video
  requiresAuth: false
</route> 