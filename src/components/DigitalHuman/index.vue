<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const props = defineProps({
  modelUrl: {
    type: String,
    default: '/models/digital-human.glb'
  }
})

const container = ref(null)
const loading = ref(true)
const error = ref('')
const debug = ref(false)

let scene, camera, renderer, controls, model

onMounted(async () => {
  try {
    // 初始化场景
    initScene()
    
    // 加载模型
    await loadModel()
    
    // 启动渲染
    animate()
    
    loading.value = false
  } catch (e) {
    error.value = e.message
    loading.value = false
  }
})

function initScene() {
  // 1. 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f0f0)
  
  // 2. 创建相机
  camera = new THREE.PerspectiveCamera(
    75, 
    container.value.clientWidth / container.value.clientHeight, 
    0.1, 
    1000
  )
  camera.position.z = 5
  
  // 3. 创建渲染器
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true
  })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)
  
  // 4. 添加控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  
  // 5. 添加光源
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(1, 1, 1)
  scene.add(directionalLight)
  
  // 6. 添加调试辅助
  if (debug.value) {
    scene.add(new THREE.AxesHelper(5))
    scene.add(new THREE.GridHelper(10, 10))
  }
}

async function loadModel() {
  try {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(props.modelUrl)
    
    model = gltf.scene
    model.traverse(obj => {
      if (obj.isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
      }
    })
    
    // 调整模型位置和大小
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3()).length()
    const center = box.getCenter(new THREE.Vector3())
    
    model.position.x += (model.position.x - center.x)
    model.position.y += (model.position.y - center.y)
    model.position.z += (model.position.z - center.z)
    
    const scale = 2 / size
    model.scale.set(scale, scale, scale)
    
    scene.add(model)
    
  } catch (e) {
    throw new Error(`无法加载3D模型: ${e.message}`)
  }
}

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

onUnmounted(() => {
  // 清理资源
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss()
    container.value?.removeChild(renderer.domElement)
  }
})
</script>

<template>
  <div class="relative w-full h-[600px] border rounded-lg overflow-hidden">
    <div ref="container" class="absolute inset-0" />
    
    <!-- 加载状态 -->
    <div 
      v-if="loading" 
      class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80"
    >
      <div class="animate-pulse text-gray-600">
        加载3D模型中...
      </div>
    </div>
    
    <!-- 错误状态 -->
    <div 
      v-if="error"
      class="absolute inset-0 flex items-center justify-center bg-red-100 text-red-600 p-4"
    >
      {{ error }}
    </div>
    
    <!-- 调试开关 -->
    <button
      @click="debug = !debug"
      class="absolute top-2 right-2 bg-white p-2 rounded shadow text-xs"
    >
      {{ debug ? '隐藏调试' : '显示调试' }}
    </button>
  </div>
</template>