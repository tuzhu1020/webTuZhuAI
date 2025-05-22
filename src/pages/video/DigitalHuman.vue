<template>
  <div class="max-w-800px mx-auto p-5 font-sans">
    <h1 class="text-2xl text-gray-800 text-center">3D数字人演示 (Vue 3 + UnoCSS)</h1>
    
    <div class="flex justify-center gap-2 my-5">
      <button 
        @click="startAudio" 
        :disabled="!!audioStream"
        class="btn-primary"
      >
        开始音频流
      </button>
      
      <button 
        @click="stopAudio" 
        :disabled="!audioStream"
        class="btn-primary"
      >
        停止音频流
      </button>
      
      <button 
        @click="toggleMockAudio" 
        v-if="showMockOption"
        class="btn bg-blue-600 hover:bg-blue-700 text-white"
      >
        {{ useMockAudio ? '使用真实麦克风' : '使用模拟音频' }}
      </button>
    </div>
    
    <DigitalHuman :audioStream="audioStream" />
    
    <div class="text-center mt-5 text-gray-600">
      <p>状态: {{ audioStatus }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DigitalHuman from '@/components/DigitalHuman/index.vue'

const audioStream = ref(null)
const useMockAudio = ref(false)
const showMockOption = ref(import.meta.env.MODE === 'development')

const audioStatus = computed(() => {
  if (!audioStream.value) return '等待音频输入'
  return `音频输入中 (${useMockAudio.value ? '模拟' : '真实'})`
})

// 获取麦克风权限
const startAudio = async () => {
  try {
    if (useMockAudio.value) {
      setupMockAudioStream()
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStream.value = stream
    }
  } catch (err) {
    console.error('Error accessing audio:', err)
    alert(`无法访问音频设备: ${err.message}`)
  }
}

// 停止音频流
const stopAudio = () => {
  if (audioStream.value) {
    audioStream.value.getTracks().forEach(track => track.stop())
    audioStream.value = null
  }
}

// 切换模拟/真实音频
const toggleMockAudio = () => {
  useMockAudio.value = !useMockAudio.value
  if (audioStream.value) {
    stopAudio()
    startAudio()
  }
}

// 模拟音频流 - 开发环境使用
const setupMockAudioStream = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.type = 'sine'
    oscillator.frequency.value = 440
    gainNode.gain.value = 0.5
    
    oscillator.connect(gainNode)
    
    // 创建媒体流目的地
    const dest = audioContext.createMediaStreamDestination()
    gainNode.connect(dest)
    
    oscillator.start()
    
    audioStream.value = dest.stream
    
    // 随机改变频率模拟语音变化
    setInterval(() => {
      oscillator.frequency.value = 200 + Math.random() * 800
      gainNode.gain.value = 0.3 + Math.random() * 0.7
    }, 300)
  } catch (err) {
    console.error('Mock audio setup error:', err)
    alert('模拟音频设置失败')
  }
}
</script>

<style>
/* UnoCSS 会自动处理样式 */
</style>