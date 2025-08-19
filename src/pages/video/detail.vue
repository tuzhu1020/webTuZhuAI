<script setup lang="ts">
import { ref, onMounted, reactive, watch } from "vue";
import { useRoute } from "vue-router";
import { message } from "ant-design-vue";
import { getVideoDetail, incView } from "@/service/videoService";
import { getDanmaku, sendDanmaku as apiSendDanmaku } from "@/service/danmakuService";
import { BASE_VIDEO_URL } from "@/config";

const route = useRoute();
const videoId = ref<string>(String((route.params as any).id || (route.query as any).id || ""));

// 视频详情（从后端获取）
const videoDetail = reactive<any>({});
const videoSrc = ref("");

// 弹幕相关
const bulletScreen = ref("");
const danmakuPool = ref<any[]>([]);

// 弹幕颜色选项
const colorOptions = ref([
  { value: "#ffffff", label: "白色" },
  { value: "#fe0302", label: "红色" },
  { value: "#00cd00", label: "绿色" },
  { value: "#0000fe", label: "蓝色" },
  { value: "#ffff00", label: "黄色" },
  { value: "#fe98ff", label: "粉色" },
]);

// 是否显示弹幕
const showDanmaku = ref(true);

// 弹幕设置（修复未定义导致的报错）
type DanmakuSize = 'small' | 'normal' | 'large'
type DanmakuPosition = 'scroll' | 'top' | 'bottom'
const danmakuSettings = reactive<{ color: string; size: DanmakuSize; position: DanmakuPosition }>(
  { color: '#ffffff', size: 'normal', position: 'scroll' }
)

// 根据大小映射像素
const sizeToPx = (size: DanmakuSize) => {
  if (size === 'small') return 16
  if (size === 'large') return 28
  return 22
}

// 播放状态
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const videoProgress = ref(0);
const videoRef = ref<HTMLVideoElement | null>(null);

// 播放控制：音量/静音/倍速
const volume = ref(0.7)
const isMuted = ref(false)
const playbackRate = ref(1.0)

const applyMediaState = () => {
  const el = videoRef.value
  if (!el) return
  el.muted = isMuted.value
  el.volume = isMuted.value ? 0 : volume.value
  el.playbackRate = playbackRate.value
}

const setVolume = (v: number) => {
  volume.value = Math.min(1, Math.max(0, v))
  if (volume.value > 0) isMuted.value = false
  applyMediaState()
}

const toggleMute = () => {
  isMuted.value = !isMuted.value
  applyMediaState()
}

const setRate = (r: number) => {
  playbackRate.value = r
  applyMediaState()
}

// 进度拖拽与点击跳转
const handleSeek = (evt: MouseEvent) => {
  const bar = evt.currentTarget as HTMLElement
  if (!bar || !videoRef.value || !duration.value) return
  const rect = bar.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (evt.clientX - rect.left) / rect.width))
  videoRef.value.currentTime = ratio * duration.value
}

// 全屏与画中画
const enterFullscreen = () => {
  const el: any = videoRef.value?.parentElement
  if (!el) return
  if (document.fullscreenElement) {
    document.exitFullscreen?.()
  } else {
    el.requestFullscreen?.()
  }
}

const enterPip = async () => {
  const el: any = videoRef.value
  if (!el) return
  try {
    if (document.pictureInPictureElement) {
      await (document as any).exitPictureInPicture?.()
    } else {
      await el.requestPictureInPicture?.()
    }
  } catch {}
}

// 弹幕显示区域尺寸与透明度
const danmakuContainerRef = ref(null);
const danmakuOpacity = ref(1)

// 视频控制
const togglePlay = () => {
  const el = videoRef.value;
  if (!el) return;
  if (el.paused) {
    el.play();
  } else {
    el.pause();
  }
};

// 发送弹幕（调用后端）
const sendDanmaku = async () => {
  if (!bulletScreen.value.trim()) {
    message.warning("弹幕内容不能为空");
    return;
  }
  const payload = {
    content: bulletScreen.value,
    color: danmakuSettings.color,
    fontSize: sizeToPx(danmakuSettings.size),
    mode: danmakuSettings.position as any,
    time: Math.floor(currentTime.value),
  };
  await apiSendDanmaku(videoId.value, payload);
  danmakuPool.value.push({
    id: Date.now(),
    text: payload.content,
    time: payload.time,
    color: payload.color,
    size: danmakuSettings.size,
    position: danmakuSettings.position,
  });
  bulletScreen.value = "";
  message.success("弹幕发送成功");
};

// 随机生成弹幕轨道位置
const getRandomTrack = () => {
  return Math.floor(Math.random() * 15) * 30;
};

// 将相对/绝对地址统一为可播放地址
const withBase = (url?: string) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${BASE_VIDEO_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

// 初始化：拉取详情与弹幕
onMounted(async () => {
  try {
    const detailResp: any = await getVideoDetail(videoId.value);
    Object.assign(videoDetail, detailResp.data || {});
    if (videoDetail.videoUrl) {
      videoSrc.value = withBase(videoDetail.videoUrl);
    }
    duration.value = Number(videoDetail.duration || 0);
    applyMediaState()
    // 计入播放量
    incView(videoId.value);
    // 首段弹幕
    const dm: any = await getDanmaku(videoId.value, { from: 0, to: 60 });
    const items = dm?.data?.items || [];
    danmakuPool.value = items.map((d: any, idx: number) => ({
      id: d._id || idx,
      text: d.content,
      time: d.time,
      color: d.color || '#fff',
      size: (d.fontSize >= 26 ? 'large' : d.fontSize <= 18 ? 'small' : 'normal'),
      position: d.mode || 'scroll',
    }));
  } catch (e) {
    // 静默失败，维持占位数据
  }
});

// 当路由变化（例如从 /video/:id 跳到 /video/detail?id=...）时，更新并重新加载
watch(
  () => route.fullPath,
  async () => {
    const newId = String((route.params as any).id || (route.query as any).id || "");
    if (newId && newId !== videoId.value) {
      videoId.value = newId;
      try {
        const detailResp: any = await getVideoDetail(videoId.value);
        Object.assign(videoDetail, detailResp.data || {});
        if (videoDetail.videoUrl) {
          videoSrc.value = withBase(videoDetail.videoUrl);
        }
        duration.value = Number(videoDetail.duration || 0);
      } catch {}
    }
  }
)
</script>

<template>
  <div class="min-h-screen bg-gray-100 py-20">
    <div class="max-w-1200 mx-auto px-4">
      <!-- 视频播放区域 -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden mb-5">
        <div class="relative">
          <!-- 视频播放器 -->
          <div class="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
            <video ref="videoRef" :src="videoSrc" class="w-full h-full object-contain" playsinline
              @play="isPlaying = true" @pause="isPlaying = false"
              @timeupdate="currentTime = ($event.target as HTMLVideoElement).currentTime; videoProgress = duration ? (currentTime / duration) * 100 : 0;"
              @loadedmetadata="duration = (videoRef?.duration as any) || duration">
            </video>
            <div v-if="!isPlaying" class="absolute inset-0 flex items-center justify-center z-10">
              <button @click="togglePlay" class="text-white bg-black/50 rounded-full p-16 hover:bg-black/70 transition-colors">
                <i class="i-tabler-player-play text-48"></i>
              </button>
            </div>

            <!-- 弹幕显示区域 -->
            <div v-if="showDanmaku" ref="danmakuContainerRef" class="absolute inset-0 overflow-hidden pointer-events-none" :style="{ opacity: danmakuOpacity }">
              <div v-for="danmaku in danmakuPool" :key="danmaku.id" :style="{
                  color: danmaku.color,
                  top: danmaku.position === 'top' ? '8px' : danmaku.position === 'bottom' ? 'calc(100% - 36px)' : `${getRandomTrack()}px`,
                  left: danmaku.position === 'scroll' ? 'auto' : '50%',
                  transform: danmaku.position === 'scroll' ? 'none' : 'translateX(-50%)',
                  animationDelay: `${danmaku.time * 0.1}s`,
                  fontSize: danmaku.size === 'large' ? '28px' : danmaku.size === 'small' ? '16px' : '22px',
                }" :class="['absolute whitespace-nowrap', danmaku.position === 'scroll' ? 'animate-danmaku' : '']">
                {{ danmaku.text }}
              </div>
            </div>

            <!-- 覆盖提示 -->
            <span v-if="!videoSrc" class="text-white text-14">暂无视频源</span>
          </div>

          <!-- 视频控制栏 -->
          <div class="bg-gray-900 p-3 text-white flex flex-col">
            <!-- 进度条 -->
            <div class="flex items-center mb-2">
              <button @click="togglePlay" class="mr-2">
                <i :class="isPlaying ? 'i-tabler-player-pause' : 'i-tabler-player-play'"></i>
              </button>
              <div class="h-3 bg-gray-700 rounded-full flex-1 cursor-pointer" @click="handleSeek">
                <div class="h-full bg-red-500 rounded-full" :style="{ width: `${videoProgress}%` }"></div>
              </div>
              <span class="ml-2 text-14">{{ Math.floor(currentTime / 60) }}:{{ (Math.floor(currentTime) % 60).toString().padStart(2, '0') }} / {{ Math.floor(duration / 60) }}:{{ (duration % 60).toString().padStart(2, '0') }}</span>
            </div>

            <!-- 控制按钮组 -->
            <div class="flex justify-between items-center">
              <div class="flex space-x-4">
                <button @click="toggleMute" :title="isMuted ? '取消静音' : '静音'">
                  <i :class="isMuted ? 'i-tabler-volume-3-off' : 'i-tabler-volume' "></i>
                </button>
                <div class="flex items-center w-120">
                  <input type="range" min="0" max="1" step="0.01" :value="isMuted ? 0 : volume" @input="setVolume(parseFloat(($event.target as HTMLInputElement).value))" />
                </div>
                <div class="flex items-center text-14">
                  倍速
                  <select class="ml-1 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" :value="playbackRate" @change="setRate(parseFloat(($event.target as HTMLSelectElement).value))">
                    <option :value="0.5">0.5x</option>
                    <option :value="1">1.0x</option>
                    <option :value="1.25">1.25x</option>
                    <option :value="1.5">1.5x</option>
                    <option :value="2">2.0x</option>
                  </select>
                </div>
                <div class="flex items-center">
                  <span class="text-14 mr-2">弹幕</span>
                  <button @click="showDanmaku = !showDanmaku" class="relative">
                    <div class="w-36 h-18 bg-gray-700 rounded-full"></div>
                    <div class="absolute top-1 h-16 w-16 rounded-full transition-all duration-300" :class="showDanmaku ? 'bg-blue-500 right-1' : 'bg-gray-400 left-1'"></div>
                  </button>
                </div>
                <div class="flex items-center ml-3" v-if="showDanmaku">
                  <span class="text-14 mr-2">透明度</span>
                  <input type="range" min="0" max="1" step="0.1" v-model.number="danmakuOpacity" class="w-120" />
                </div>
              </div>
              <div>
                <button @click="enterPip">
                  <i class="i-tabler-picture-in-picture"></i>
                </button>
                <button class="ml-3" @click="enterFullscreen">
                  <i class="i-tabler-arrows-maximize"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 标题与数据 -->
      <div class="bg-white rounded-xl shadow-sm p-5 mb-5">
        <h1 class="text-22 font-bold mb-2">{{ videoDetail.title || '未命名视频' }}</h1>
        <div class="text-gray-500 text-14">
          {{ videoDetail.views || 0 }} 次观看 · {{ videoDetail.publishTime || '' }}
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