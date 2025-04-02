<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { message, Modal, Upload } from "ant-design-vue";
import type { UploadProps } from "ant-design-vue";

const router = useRouter();

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

// 模拟视频数据
const videos = [
  {
    id: 1,
    title: "如何高效使用AI助手",
    cover: "/video-covers/cover1.jpg",
    duration: "10:25",
    author: "张三",
    views: "2.3万",
    publishTime: "3天前",
  },
  {
    id: 2,
    title: "前端开发实用技巧分享",
    cover: "/video-covers/cover2.jpg",
    duration: "15:40",
    author: "李四",
    views: "1.8万",
    publishTime: "1周前",
  },
  {
    id: 3,
    title: "Vue3 与 TypeScript 结合使用",
    cover: "/video-covers/cover3.jpg",
    duration: "20:15",
    author: "王五",
    views: "3.2万",
    publishTime: "2天前",
  },
  {
    id: 4,
    title: "前端性能优化全攻略",
    cover: "/video-covers/cover4.jpg",
    duration: "18:30",
    author: "赵六",
    views: "1.5万",
    publishTime: "5小时前",
  },
  {
    id: 5,
    title: "CSS动画实战技巧",
    cover: "/video-covers/cover5.jpg",
    duration: "12:45",
    author: "钱七",
    views: "2.7万",
    publishTime: "昨天",
  },
  {
    id: 6,
    title: "JavaScript高级编程",
    cover: "/video-covers/cover6.jpg",
    duration: "25:10",
    author: "孙八",
    views: "4.1万",
    publishTime: "3天前",
  },
  {
    id: 7,
    title: "React vs Vue：深度对比",
    cover: "/video-covers/cover7.jpg",
    duration: "30:20",
    author: "周九",
    views: "5.6万",
    publishTime: "1周前",
  },
  {
    id: 8,
    title: "Web3开发入门指南",
    cover: "/video-covers/cover8.jpg",
    duration: "22:15",
    author: "吴十",
    views: "3.8万",
    publishTime: "2天前",
  },
  {
    id: 9,
    title: "响应式设计最佳实践",
    cover: "/video-covers/cover9.jpg",
    duration: "15:45",
    author: "郑十一",
    views: "2.4万",
    publishTime: "1天前",
  },
  {
    id: 10,
    title: "Git进阶技巧分享",
    cover: "/video-covers/cover10.jpg",
    duration: "18:30",
    author: "王十二",
    views: "3.1万",
    publishTime: "4天前",
  },
];

// 视频上传相关
const uploadVisible = ref(false);

const uploadVideoForm = reactive({
  title: "",
  description: "",
  tags: "",
  cover: "",
  videoFile: "",
});

// 上传视频封面
const coverProps: UploadProps = {
  name: "file",
  action: "https://api.example.com/upload",
  headers: {
    authorization: "authorization-text",
  },
  onChange(info) {
    if (info.file.status === "done") {
      uploadVideoForm.cover = (info.file.response as { url: string }).url;
      message.success(`${info.file.name} 上传成功`);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} 上传失败`);
    }
  },
};

// 上传视频文件
const videoProps: UploadProps = {
  name: "file",
  action: "https://api.example.com/upload",
  headers: {
    authorization: "authorization-text",
  },
  onChange(info) {
    if (info.file.status === "done") {
      uploadVideoForm.videoFile = (info.file.response as { url: string }).url;
      message.success(`${info.file.name} 上传成功`);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} 上传失败`);
    }
  },
};

// 提交视频
const submitVideoUpload = () => {
  if (!uploadVideoForm.title) {
    message.warning("请输入视频标题");
    return;
  }

  if (!uploadVideoForm.videoFile) {
    message.warning("请上传视频文件");
    return;
  }

  // 模拟上传成功
  message.success("视频上传成功，等待审核");
  uploadVisible.value = false;

  // 重置表单
  Object.assign(uploadVideoForm, {
    title: "",
    description: "",
    tags: "",
    cover: "",
    videoFile: "",
  });
};

// 跳转到视频详情
const goToVideoDetail = (videoId: number) => {
  router.push(`/video/${videoId}`);
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

      <!-- 视频列表 -->
      <h2 class="text-24 font-bold mb-5 flex items-center">
        <i class="i-tabler-flame text-orange-500 mr-2"></i>
        热门推荐
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-10">
        <div v-for="video in videos" :key="video.id" class="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer" @click="goToVideoDetail(video.id)">
          <div class="relative">
            <div class="aspect-video bg-gray-200 flex items-center justify-center overflow-hidden">
              <span class="text-64">🎬</span>
            </div>
            <span class="absolute bottom-2 right-2 bg-black/70 text-white text-12 px-2 py-1 rounded">{{ video.duration }}</span>
          </div>
          <div class="p-3">
            <h3 class="text-14 font-bold text-gray-800 mb-2 line-clamp-2 h-40">{{ video.title }}</h3>
            <div class="flex items-center text-gray-500 text-12 mb-2">
              <i class="i-tabler-user-circle mr-1"></i>
              <span>{{ video.author }}</span>
            </div>
            <div class="flex justify-between text-gray-500 text-12">
              <div class="flex items-center">
                <i class="i-tabler-eye mr-1"></i>
                <span>{{ video.views }}</span>
              </div>
              <span>{{ video.publishTime }}</span>
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
        <div v-for="video in videos.slice(0, 5)" :key="`tech-${video.id}`" class="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer" @click="goToVideoDetail(video.id)">
          <div class="relative">
            <div class="aspect-video bg-gray-200 flex items-center justify-center overflow-hidden">
              <span class="text-64">🎬</span>
            </div>
            <span class="absolute bottom-2 right-2 bg-black/70 text-white text-12 px-2 py-1 rounded">{{ video.duration }}</span>
          </div>
          <div class="p-3">
            <h3 class="text-14 font-bold text-gray-800 mb-2 line-clamp-2 h-40">{{ video.title }}</h3>
            <div class="flex items-center text-gray-500 text-12 mb-2">
              <i class="i-tabler-user-circle mr-1"></i>
              <span>{{ video.author }}</span>
            </div>
            <div class="flex justify-between text-gray-500 text-12">
              <div class="flex items-center">
                <i class="i-tabler-eye mr-1"></i>
                <span>{{ video.views }}</span>
              </div>
              <span>{{ video.publishTime }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 回到顶部按钮 -->
      <button class="fixed right-5 bottom-5 bg-white p-3 rounded-full shadow-md hover:shadow-lg transition-shadow">
        <i class="i-tabler-arrow-up text-18"></i>
      </button>

      <!-- 视频上传弹窗 -->
      <Modal :open="uploadVisible" @update:open="(val) => uploadVisible = val" title="上传视频" okText="上传" cancelText="取消" @ok="submitVideoUpload" width="600px">
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