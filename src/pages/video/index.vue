<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { message, Modal, Upload } from "ant-design-vue";
import type { UploadProps } from "ant-design-vue";
import { BASE_VIDEO_URL } from '@/config'
import { useUserStore } from '@/stores/user'
import { getHotVideos, getRecommendVideos, createVideo } from '@/service/videoService'

const router = useRouter();
const userStore = useUserStore();
const token = computed(() => userStore.token);
const uploadAction = computed(() => `${BASE_VIDEO_URL}/api/upload`);
const uploadHeaders = computed(() => {
  if (!token.value) return {} as Record<string, string>;
  const hasBearer = token.value.toLowerCase().startsWith('bearer ');
  return {
    Authorization: hasBearer ? token.value : `Bearer ${token.value}`,
  } as Record<string, string>;
});

const ensureLoginBeforeUpload: UploadProps['beforeUpload'] = () => {
  if (!token.value) {
    message.error('请先登录后再上传');
    // 阻止加入列表并取消上传
    return Upload.LIST_IGNORE as unknown as boolean;
  }
  return true;
};

// 模拟视频分类数据
const categories = [
  { id: 1, name: "推荐", icon: "i-tabler-star" },
  { id: 2, name: "热门", icon: "i-tabler-flame" },
  { id: 3, name: "动画", icon: "i-tabler-alien" },
  { id: 4, name: "音乐", icon: "i-tabler-music" },
  { id: 5, name: "舞蹈", icon: "i-tabler-dance" },
  { id: 6, name: "游戏", icon: "i-tabler-device-gamepad-2" },
  { id: 7, name: "知识", icon: "i-tabler-bulb" },
  { id: 8, name: "科技", icon: "i-tabler-device-laptop" },
  { id: 9, name: "运动", icon: "i-tabler-run" },
  { id: 10, name: "生活", icon: "i-tabler-coffee" },
  { id: 11, name: "美食", icon: "i-tabler-meat" },
  { id: 12, name: "动物", icon: "i-tabler-dog" },
];

// 当前选中的分类
const activeCategory = ref(1);

// 模拟轮播图数据
const banners = [
  { id: 1, title: "新功能上线：弹幕互动2.0", image: "/images/banner1.jpg" },
  { id: 2, title: "年度技术峰会直播", image: "/images/banner2.jpg" },
  { id: 3, title: "编程挑战赛开始报名", image: "/images/banner3.jpg" },
];

// 当前活动的轮播图
const activeBanner = ref(0);

// 自动轮播
setInterval(() => {
  activeBanner.value = (activeBanner.value + 1) % banners.length;
}, 5000);

// 视频列表（改为接口数据）
const list = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(20)
const hasMore = ref(true)

const fmtViews = (n?: number) => {
  if (typeof n !== 'number') return '—'
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
  return String(n)
}
const fmtDuration = (sec?: number | string) => {
  if (typeof sec === 'string' && sec.includes(':')) return sec
  const s = Number(sec || 0) | 0
  const m = Math.floor(s / 60)
  const r = (s % 60).toString().padStart(2, '0')
  return `${m}:${r}`
}
const withBase = (url?: string) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${BASE_VIDEO_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

const mapItem = (it: any) => ({
  id: String(it._id || it.id || ''),
  title: it.title || '未命名视频',
  cover: withBase(it.coverUrl || it.cover),
  duration: fmtDuration(it.duration),
  author: it.author?.name || it.author || '匿名',
  views: fmtViews(it.stats?.views ?? it.views),
  publishTime: it.publishTime || it.createdAt || '',
})

const loadList = async (reset = false) => {
  if (loading.value) return
  loading.value = true
  try {
    if (reset) { page.value = 1; list.value = []; hasMore.value = true }
    const params = { page: page.value, size: size.value }
    const api = activeCategory.value === 2 ? getHotVideos : getRecommendVideos
    const resp: any = await api(params)
    const items = resp?.data?.items || resp?.data?.list || resp?.items || []
    const mapped = items.map(mapItem)
    list.value = reset ? mapped : [...list.value, ...mapped]
    hasMore.value = items.length >= size.value
    if (hasMore.value) page.value += 1
  } catch (e) {
    message.error('加载视频失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => loadList(true))
watch(activeCategory, () => loadList(true))

// 视频上传相关
const uploadVisible = ref(false);
const isUploadingCover = ref(false);
const isUploadingVideo = ref(false);

const uploadVideoForm = reactive({
  title: "",
  description: "",
  tags: "",
  cover: "",
  videoFile: "",
});

// 上传视频封面（响应式 props）
const coverProps = computed<UploadProps>(() => ({
  name: 'file',
  action: uploadAction.value,
  headers: uploadHeaders.value,
  accept: 'image/*',
  beforeUpload: ensureLoginBeforeUpload,
  onChange(info) {
    if (info.file.status === 'uploading') {
      isUploadingCover.value = true;
    } else if (info.file.status === 'done') {
      // 兼容两种返回：
      // 1) 直接 { data: { url } }
      // 2) 统一包装 { code:'200', data: { status:'success', data:{ url } }, message }
      const resp = info.file.response as any;
      const coverUrl = resp?.data?.url || resp?.data?.data?.url || resp?.url || '';
      uploadVideoForm.cover = coverUrl;
      message.success(`${info.file.name} 上传成功`);
      isUploadingCover.value = false;
    } else if (info.file.status === 'error') {
      const errMsg = (info.file?.response?.message) || '上传失败';
      message.error(`${info.file.name} ${errMsg}`);
      isUploadingCover.value = false;
    }
  },
}));

// 上传视频文件（响应式 props）
const videoProps = computed<UploadProps>(() => ({
  name: 'file',
  action: uploadAction.value,
  headers: uploadHeaders.value,
  accept: 'video/*',
  maxCount: 1,
  beforeUpload: ensureLoginBeforeUpload,
  onChange(info) {
    if (info.file.status === 'uploading') {
      isUploadingVideo.value = true;
    } else if (info.file.status === 'done') {
      const resp = info.file.response as any;
      const videoUrl = resp?.data?.url || resp?.data?.data?.url || resp?.url || '';
      uploadVideoForm.videoFile = videoUrl;
      message.success(`${info.file.name} 上传成功`);
      isUploadingVideo.value = false;
    } else if (info.file.status === 'error') {
      const errMsg = (info.file?.response?.message) || '上传失败';
      message.error(`${info.file.name} ${errMsg}`);
      isUploadingVideo.value = false;
    } else if (info.file.status === 'removed') {
      // 清理表单绑定，避免残留导致误提交
      uploadVideoForm.videoFile = '';
      isUploadingVideo.value = false;
    }
  },
}));

// 提交视频
const submitVideoUpload = async () => {
  if (!uploadVideoForm.title) {
    message.warning("请输入视频标题");
    return;
  }

  if (isUploadingVideo.value) {
    message.warning("视频正在上传，请稍候");
    return;
  }

  if (!uploadVideoForm.videoFile) {
    message.warning("请上传视频文件");
    return;
  }

  try {
    const payload = {
      title: uploadVideoForm.title,
      description: uploadVideoForm.description || '',
      tags: uploadVideoForm.tags ? uploadVideoForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      coverUrl: uploadVideoForm.cover || '',
      videoUrl: uploadVideoForm.videoFile,
      // 可选: 由前端或转码回填，这里先置0
      duration: 0,
    }
    await createVideo(payload as any)
    message.success("视频创建成功");
    uploadVisible.value = false;
    // 重置表单
    Object.assign(uploadVideoForm, {
      title: "",
      description: "",
      tags: "",
      cover: "",
      videoFile: "",
    });
    // 刷新列表
    loadList(true)
  } catch (e: any) {
    message.error(e?.message || '创建视频失败')
  }
};

// 跳转到视频详情
const goToVideoDetail = (videoId: string) => {
  if (!videoId) return
  router.push(`/video/${videoId}`);
//   router.push({
//     path: '/video/richText',
//     query: {
//       id: videoId
//     }
//   });
};

// 搜索功能
const searchKeyword = ref("");

const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    message.info("请输入搜索关键词");
    return;
  }

  message.info(`搜索: ${searchKeyword.value}`);
  // 实际应用中这里会调用搜索API
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-20">
    <div class="max-w-1200 mx-auto px-4">
      <!-- 顶部分类栏 -->
      <div class="bg-white rounded-xl shadow-sm p-4 mb-5">
        <div class="flex overflow-x-auto scrollbar-hide pb-2">
          <div v-for="category in categories" :key="category.id" @click="activeCategory = category.id" :class="{'bg-blue-500 text-white': activeCategory === category.id, 'bg-gray-100 text-gray-700': activeCategory !== category.id}" class="flex items-center px-4 py-2 rounded-full mr-3 cursor-pointer transition-colors flex-shrink-0">
            <i :class="category.icon" class="mr-1"></i>
            {{ category.name }}
          </div>
        </div>
      </div>

      <!-- 顶部功能栏 -->
      <div class="bg-white rounded-xl shadow-sm p-4 mb-5 flex justify-between items-center flex-wrap gap-3">
        <div class="flex space-x-4">
          <button @click="uploadVisible = true" class="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-5 py-2 transition-colors flex items-center">
            <i class="i-tabler-upload mr-2"></i>
            上传视频
          </button>
          <button class="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-5 py-2 transition-colors flex items-center">
            <i class="i-tabler-video mr-2"></i>
            我的视频
          </button>
          <button class="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-5 py-2 transition-colors flex items-center">
            <i class="i-tabler-history mr-2"></i>
            观看历史
          </button>
        </div>
        <div class="w-full md:w-1/3 flex">
          <input v-model="searchKeyword" type="text" placeholder="搜索视频..." class="w-full px-4 py-2 border border-gray-200 rounded-l-full focus:outline-none focus:ring-2 focus:ring-blue-500" @keyup.enter="handleSearch">
          <button @click="handleSearch" class="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-r-full transition-colors">
            <i class="i-tabler-search"></i>
          </button>
        </div>
      </div>

      <!-- 轮播图区域 -->
      <div class="relative bg-white rounded-xl shadow-sm overflow-hidden mb-8">
        <div class="aspect-video overflow-hidden relative">
          <!-- 轮播图 -->
          <div v-for="(banner, index) in banners" :key="banner.id" :class="{ 'opacity-100': index === activeBanner, 'opacity-0': index !== activeBanner }" class="absolute inset-0 transition-opacity duration-500 ease-in-out">
            <div class="w-full h-full bg-gray-300 flex items-center justify-center">
              <span class="text-64">🎬</span>
            </div>
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5">
              <h3 class="text-24 md:text-32 font-bold text-white">{{ banner.title }}</h3>
            </div>
          </div>

          <!-- 指示器 -->
          <div class="absolute bottom-5 right-5 flex space-x-2">
            <button v-for="(_, index) in banners" :key="index" @click="activeBanner = index" :class="{ 'bg-white': index === activeBanner, 'bg-white/50': index !== activeBanner }" class="w-8 h-2 rounded-full transition-colors"></button>
          </div>
        </div>
      </div>

      <!-- 视频列表（推荐/热门） -->
      <h2 class="text-24 font-bold mb-5 flex items-center">
        <i v-if="activeCategory === 2" class="i-tabler-flame text-orange-500 mr-2"></i>
        <i v-else class="i-tabler-star text-yellow-500 mr-2"></i>
        {{ activeCategory === 2 ? '热门' : '推荐' }}
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-10">
        <div v-for="video in list" :key="video.id" class="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer" @click="goToVideoDetail(video.id)">
          <div class="relative">
            <!-- 固定16:9比例容器，避免依赖插件 -->
            <div class="w-full bg-gray-200 overflow-hidden relative" style="padding-top:56.25%">
              <img v-if="video.cover || video.coverUrl"
                   :src="withBase(video.cover || video.coverUrl)"
                   alt="cover"
                   class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
              <div v-else class="absolute inset-0 w-full h-full flex items-center justify-center text-48">🎬</div>
            </div>
            <span class="absolute bottom-2 right-2 bg-black/70 text-white text-12 px-2 py-1 rounded">{{ video.duration }}</span>
          </div>
          <div class="p-3">
            <h3 class="text-14 font-bold text-gray-800 mb-2 line-clamp-2 h-40">{{ video.title }}</h3>
            <div class="flex items-center justify-between text-gray-500 text-12">
              <div class="flex items-center">
                <i class="i-tabler-eye mr-1"></i>
                <span>{{ video.views }}</span>
              </div>
              <span class="truncate max-w-120"><i class="i-tabler-user-circle mr-1"></i>{{ video.author }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分区视频 -->
      <h2 class="text-24 font-bold mb-5 flex items-center">
        <i class="i-tabler-device-laptop text-blue-500 mr-2"></i>
        科技区
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-20">
        <div v-for="video in list.slice(0, 5)" :key="`tech-${video.id}`" class="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer" @click="goToVideoDetail(video.id)">
          <div class="relative">
            <div class="w-full bg-gray-200 overflow-hidden relative" style="padding-top:56.25%">
              <img v-if="video.cover"
                   :src="video.cover"
                   alt="cover"
                   class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
              <div v-else class="absolute inset-0 w-full h-full flex items-center justify-center text-48">🎬</div>
            </div>
            <span class="absolute bottom-2 right-2 bg-black/70 text-white text-12 px-2 py-1 rounded">{{ video.duration }}</span>
          </div>
          <div class="p-3">
            <h3 class="text-14 font-bold text-gray-800 mb-2 line-clamp-2 h-40">{{ video.title }}</h3>
            <div class="flex items-center justify-between text-gray-500 text-12">
              <div class="flex items-center">
                <i class="i-tabler-eye mr-1"></i>
                <span>{{ video.views }}</span>
              </div>
              <span class="truncate max-w-120"><i class="i-tabler-user-circle mr-1"></i>{{ video.author }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 回到顶部按钮 -->
      <button class="fixed right-5 bottom-5 bg-white p-3 rounded-full shadow-md hover:shadow-lg transition-shadow">
        <i class="i-tabler-arrow-up text-18"></i>
      </button>

      <!-- 视频上传弹窗 -->
      <Modal :open="uploadVisible" @update:open="(val) => uploadVisible = val" title="上传视频" okText="上传" cancelText="取消" @ok="submitVideoUpload" width="600px" :confirmLoading="isUploadingVideo">
        <div class="p-4">
          <div class="mb-4">
            <label class="block text-14 font-medium text-gray-700 mb-2">视频标题 <span class="text-red-500">*</span></label>
            <input v-model="uploadVideoForm.title" type="text" placeholder="请输入视频标题" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div class="mb-4">
            <label class="block text-14 font-medium text-gray-700 mb-2">视频描述</label>
            <textarea v-model="uploadVideoForm.description" placeholder="请输入视频描述" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows="4"></textarea>
          </div>

          <div class="mb-4">
            <label class="block text-14 font-medium text-gray-700 mb-2">标签（多个标签用逗号分隔）</label>
            <input v-model="uploadVideoForm.tags" type="text" placeholder="如：前端,Vue,技术分享" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div class="mb-4">
            <label class="block text-14 font-medium text-gray-700 mb-2">视频封面</label>
            <Upload v-bind="coverProps" list-type="picture-card">
              <div>
                <i class="i-tabler-upload"></i>
                <div class="mt-2">上传封面</div>
              </div>
            </Upload>
          </div>

          <div class="mb-4">
            <label class="block text-14 font-medium text-gray-700 mb-2">视频文件 <span class="text-red-500">*</span></label>
            <Upload v-bind="videoProps">
              <button class="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center">
                <i class="i-tabler-upload mr-2"></i>
                选择视频文件
              </button>
            </Upload>
            <div class="mt-2 text-12 text-gray-500">
              支持常见视频格式，单个文件大小不超过500MB
            </div>
          </div>
        </div>
      </Modal>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

<route lang="yaml">
meta:
  layout: video
  requiresAuth: false
</route> 