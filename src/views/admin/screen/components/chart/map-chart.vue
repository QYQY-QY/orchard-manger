<!-- src/views/admin/screen/components/chart/map-chart.vue -->
<template>
  <div class="map-chart-container" ref="mapContainer">
    <div class="map-loading" v-if="loading">地图加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const props = defineProps<{
  countyData?: Array<{ name: string; lng: number; lat: number; count: number }>
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'mapReady'): void
}>()

const mapContainer = ref<HTMLElement>()

// Three.js 相关变量
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationId: number
let zhejiangGroup: THREE.Group
let stars: THREE.Points

// 浙江省经纬度范围
const ZHEJIANG_BOUNDS = {
  minLng: 118.0,
  maxLng: 123.0,
  minLat: 27.0,
  maxLat: 31.2,
}
const MAP_SIZE = 36

// 地级市中心点（仅用于定位，不显示标签）
const cityCenters = [
  { name: '杭州市', lng: 120.15, lat: 30.28 },
  { name: '宁波市', lng: 121.55, lat: 29.88 },
  { name: '温州市', lng: 120.70, lat: 28.00 },
  { name: '台州市', lng: 121.42, lat: 28.65 },
  { name: '衢州市', lng: 118.88, lat: 28.97 },
  { name: '丽水市', lng: 119.92, lat: 28.45 },
  { name: '金华市', lng: 119.65, lat: 29.08 },
  { name: '绍兴市', lng: 120.58, lat: 30.03 },
  { name: '湖州市', lng: 120.10, lat: 30.87 },
  { name: '嘉兴市', lng: 120.75, lat: 30.75 },
  { name: '舟山市', lng: 122.20, lat: 30.00 }
]

// 坐标转换函数
const lngLatToPosition = (lng: number, lat: number) => {
  const x = (lng - ZHEJIANG_BOUNDS.minLng) / (ZHEJIANG_BOUNDS.maxLng - ZHEJIANG_BOUNDS.minLng) * MAP_SIZE - MAP_SIZE/2
  const z = (ZHEJIANG_BOUNDS.maxLat - lat) / (ZHEJIANG_BOUNDS.maxLat - ZHEJIANG_BOUNDS.minLat) * MAP_SIZE - MAP_SIZE/2
  return { x, z }
}

// 初始化Three场景
const initThree = async () => {
  if (!mapContainer.value) return

  // 场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a1a2a)

  // 相机
  camera = new THREE.PerspectiveCamera(45, mapContainer.value.clientWidth / mapContainer.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 22, 38)
  camera.lookAt(0, 2, 0)

  // WebGL渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(mapContainer.value.clientWidth, mapContainer.value.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  mapContainer.value.appendChild(renderer.domElement)

  // 控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.3
  controls.enableZoom = true
  controls.maxPolarAngle = Math.PI / 2.2
  controls.target.set(0, 2, 0)

  // 灯光
  const ambientLight = new THREE.AmbientLight(0x404060)
  scene.add(ambientLight)

  const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2)
  dirLight.position.set(10, 20, 15)
  scene.add(dirLight)
  
  const fillLight = new THREE.DirectionalLight(0x88aadd, 0.6)
  fillLight.position.set(-10, 10, -15)
  scene.add(fillLight)

  // 添加一些点光源增加桔园区域的亮度
  const pointLight1 = new THREE.PointLight(0xffaa33, 0.3, 40)
  pointLight1.position.set(5, 8, -3)
  scene.add(pointLight1)
  
  const pointLight2 = new THREE.PointLight(0xff8833, 0.3, 40)
  pointLight2.position.set(-5, 8, 2)
  scene.add(pointLight2)

  // 星空背景
  const starsGeometry = new THREE.BufferGeometry()
  const starsCount = 2000
  const starPositions = new Float32Array(starsCount * 3)
  for (let i = 0; i < starsCount; i++) {
    starPositions[i*3] = (Math.random() - 0.5) * 600
    starPositions[i*3+1] = (Math.random() - 0.5) * 600
    starPositions[i*3+2] = (Math.random() - 0.5) * 600 - 150
  }
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.25 })
  stars = new THREE.Points(starsGeometry, starsMaterial)
  scene.add(stars)

  // 主组
  zhejiangGroup = new THREE.Group()
  scene.add(zhejiangGroup)

  // 加载地图数据
  await loadZhejiangMap()

  emit('mapReady')
}

// 加载浙江省地图
const loadZhejiangMap = async () => {
  try {
    // 尝试加载真实地图数据
    const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/330000_full.json')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const geojson = await response.json()
    console.log('地图数据加载成功，特征数:', geojson.features.length)
    
    // 创建县级地图
    createCountyMap(geojson)
    
    // 注意：不再添加城市标签
    
  } catch (error) {
    console.error('加载地图数据失败，使用备用地图:', error)
    
    // 显示备用的简单地图
    createFallbackMap()
  }
}

// 备用地图（当API失败时）
const createFallbackMap = () => {
  // 创建一个简单的绿色平面作为背景
  const geometry = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE)
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x2a6a3a,
    emissive: 0x0a1a0a,
    side: THREE.DoubleSide
  })
  const plane = new THREE.Mesh(geometry, material)
  plane.rotation.x = -Math.PI / 2
  plane.position.y = -0.1
  zhejiangGroup.add(plane)
  
  // 添加网格线
  const gridHelper = new THREE.GridHelper(MAP_SIZE, 20, 0x88aa88, 0x446644)
  gridHelper.position.y = 0
  zhejiangGroup.add(gridHelper)
}

// 创建县级地图
const createCountyMap = (geojson: any) => {
  const features = geojson.features
  
  // 为每个区县创建独立的多边形
  features.forEach((feature: any, index: number) => {
    const geometry = feature.geometry
    const properties = feature.properties
    
    // 随机生成颜色，但保持绿色调
    const hue = 0.3 + Math.random() * 0.2 // 绿色调范围
    const baseColor = new THREE.Color().setHSL(hue, 0.7, 0.4)
    
    // 处理多边形
    if (geometry.type === 'Polygon') {
      createMeshFromPolygon(geometry.coordinates, baseColor)
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((polygonCoords: any) => {
        createMeshFromPolygon(polygonCoords, baseColor)
      })
    }
  })
}

// 从多边形坐标创建网格
const createMeshFromPolygon = (coordinates: any, baseColor: THREE.Color) => {
  try {
    const shapes: THREE.Shape[] = []
    
    coordinates.forEach((ring: any, index: number) => {
      const points = ring.map((coord: number[]) => {
        const [lng, lat] = coord
        const { x, z } = lngLatToPosition(lng, lat)
        return new THREE.Vector2(x, z)
      })
      
      // 确保多边形闭合
      if (points.length > 2) {
        const first = points[0]
        const last = points[points.length - 1]
        if (Math.abs(first.x - last.x) > 0.001 || Math.abs(first.y - last.y) > 0.001) {
          points.push(new THREE.Vector2(first.x, first.y))
        }
      }
      
      if (index === 0) {
        // 外环
        try {
          const shape = new THREE.Shape(points)
          shapes.push(shape)
        } catch (e) {
          // 忽略单个形状错误
        }
      } else {
        // 内环（洞）
        if (shapes.length > 0) {
          try {
            const lastShape = shapes[shapes.length - 1]
            const holePath = new THREE.Path(points)
            lastShape.holes.push(holePath)
          } catch (e) {
            // 忽略洞错误
          }
        }
      }
    })
    
    if (shapes.length === 0) return
    
    // 为每个形状创建网格
    shapes.forEach(shape => {
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 2
      })
      
      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: 0x111111,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      
      // 平放
      mesh.rotation.x = -Math.PI / 2
      mesh.position.y = 0
      
      zhejiangGroup.add(mesh)
      
      // 添加边缘线条
      const edges = new THREE.EdgesGeometry(geometry)
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x88aa88, transparent: true, opacity: 0.3 }))
      line.rotation.copy(mesh.rotation)
      line.position.copy(mesh.position)
      zhejiangGroup.add(line)
    })
    
  } catch (e) {
    // console.warn('创建区县网格失败')
  }
}

// 动画循环
const animate = () => {
  animationId = requestAnimationFrame(animate)
  if (controls) controls.update()
  if (stars) stars.rotation.y += 0.0001
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

// 窗口自适应
const handleResize = () => {
  if (!mapContainer.value || !camera || !renderer) return
  const width = mapContainer.value.clientWidth
  const height = mapContainer.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

onMounted(() => {
  initThree()
  animate()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
  if (renderer && mapContainer.value) {
    mapContainer.value.removeChild(renderer.domElement)
  }
  renderer?.dispose()
})
</script>

<style scoped>
.map-chart-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #0a1a2a;
}

.map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  background: rgba(0,0,0,0.7);
  padding: 8px 20px;
  border-radius: 40px;
  z-index: 10;
  border: 1px solid #ff8c00;
}
</style>