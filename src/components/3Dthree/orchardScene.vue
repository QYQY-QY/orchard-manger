<template>
  <div class="orchard-container">
    <!-- 信息面板 -->
    <div class="info-panel">
      <h1>🍎 智慧果园 · 种植基地 <span>{{负责人}}</span></h1>
      <p>负责人: {{负责人}} | 总面积: {{总面积}} 亩 | 果树: {{果树总数}} 棵 | 年产量: {{年产量}} 吨</p>
    </div>

    <!-- 固定在页面中上部的标题 -->
    <div class="fixed-title">智慧果园</div>

    <!-- 右侧数据面板 -->
    <div class="stats-panel">
      <div class="title">📊 种植区数据 (随机生成)</div>
      <div class="item"><span class="label">种植区数量 :</span> <span class="value highlight">{{种植区数量}}</span></div>
      <div class="item"><span class="label">总面积 (亩) :</span> <span class="value highlight">{{总面积}}</span></div>
      <div class="item"><span class="label">果树总数 :</span> <span class="value highlight">{{果树总数}}</span></div>
      <div class="item"><span class="label">预估年产量 :</span> <span class="value highlight">{{年产量}} 吨</span></div>
      <div class="note">
        🍊 不规则地面拼块 <br> 🍎 鼠标悬停凸起 <br> 👆 点击查看详情
      </div>
    </div>

    <!-- 种植区详情弹窗 -->
    <div class="detail-modal" :class="{ show: showDetail }">
      <div class="close-btn" @click="hideDetail">×</div>
      <div class="zone-name">{{ selectedZone?.name || '🍑 水蜜桃种植区' }}</div>
      <div class="detail-item">
        <span class="label">种植面积</span>
        <span class="value">{{ selectedZone?.area || 120 }} <span class="highlight-number">亩</span></span>
      </div>
      <div class="detail-item">
        <span class="label">果树数量</span>
        <span class="value">{{ selectedZone?.trees || 3200 }} <span class="highlight-number">棵</span></span>
      </div>
      <div class="detail-item">
        <span class="label">预估年产量</span>
        <span class="value">{{ selectedZone?.yield || 85 }} <span class="highlight-number">吨</span></span>
      </div>
      <div class="detail-item">
        <span class="label">主要品种</span>
        <span class="value">{{ selectedZone?.variety || '水蜜桃' }}</span>
      </div>
      <div class="detail-item">
        <span class="label">种植密度</span>
        <span class="value">{{ selectedZone?.density || 27 }} <span class="highlight-number">棵/亩</span></span>
      </div>
      <div class="modal-footer">—— 悬停凸起，点击查看详情 ——</div>
    </div>

    <!-- 悬停提示 -->
    <div class="hover-hint" :style ="{ opacity: showDetail ? 0 : 0.7 }">👆 鼠标悬停区域会凸起 | 点击查看详情</div>

    <div class="controls-note">🖱️ 鼠标拖动旋转 | 滚轮缩放 | 悬停凸起效果</div>

    <!-- Three.js 画布容器 -->
    <div ref="canvasContainer" class="canvas-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, reactive } from 'vue'

import Index from '@/views/admin/Index.vue'
import superIndex from '@/views/super-admin/Index.vue'

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'


// 响应式数据
const canvasContainer = ref(null)
const 负责人 = ref('杨某某')
const 种植区数量 = ref(0)
const 总面积 = ref(0)
const 果树总数 = ref(0)
const 年产量 = ref(0)
const showDetail = ref(false)
const selectedZone = ref(null)

// Three.js 相关变量
let scene, camera, renderer, labelRenderer, controls
let zoneMeshes = []
let currentHovered = null
let raycaster, mouse
let stars, pollen
let animationId

// 初始化数据
const fruitNames = [
  { name: "🍎 红富士苹果", variety: "红富士" },
  { name: "🍐 黄金梨", variety: "黄金梨" },
  { name: "🍑 水蜜桃", variety: "水蜜桃" },
  { name: "🍊 脐橙", variety: "脐橙" },
  { name: "🍒 樱桃", variety: "樱桃" },
  { name: "🍓 草莓", variety: "草莓" },
  { name: "🍇 巨峰葡萄", variety: "巨峰葡萄" },
  { name: "🍋 柠檬", variety: "柠檬" },
  { name: "🍈 哈密瓜", variety: "哈密瓜" },
  { name: "🍌 香蕉", variety: "香蕉" }
]

// 生成随机数据
const generateZones = () => {
  const zoneCount = Math.floor(Math.random() * 4) + 4
  种植区数量.value = zoneCount

  const shuffled = [...fruitNames].sort(() => 0.5 - Math.random())
  const zones = shuffled.slice(0, zoneCount).map((fruit, index) => ({
    ...fruit,
    shortName: fruit.name.split(' ')[1] || fruit.variety,
    area: Math.floor(50 + Math.random() * 100),
    trees: Math.floor(1000 + Math.random() * 3000),
    yield: Math.floor(20 + Math.random() * 100),
    density: 0,
    baseHeight: 0.2,
    hoverHeight: 0.6,
    color: getZoneColor(index)
  }))

  zones.forEach(zone => {
    zone.density = Math.round(zone.trees / zone.area * 10) / 10
  })

  const totalArea = zones.reduce((sum, z) => sum + z.area, 0)
  const totalTrees = zones.reduce((sum, z) => sum + z.trees, 0)
  const totalYield = zones.reduce((sum, z) => sum + z.yield, 0)

  总面积.value = totalArea
  果树总数.value = totalTrees
  年产量.value = totalYield

  return zones
}

const getZoneColor = (index) => {
  const colors = [
    0xffaa66, 0xff8c66, 0xffb366, 0xff9966, 0xffa57a, 0xffbb88, 0xffa56b
  ]
  return colors[index % colors.length]
}

// 生成不规则多边形
const generatePolygons = (zoneCount) => {
  const centerPoints = []
  for (let i = 0; i < zoneCount; i++) {
    const angle = (i / zoneCount) * Math.PI * 2 + Math.random() * 0.5
    const r = 7 + Math.random() * 4
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    centerPoints.push({ x, z, index: i })
  }

  return centerPoints.map((center) => {
    const numPoints = 6 + Math.floor(Math.random() * 4)
    const points = []
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2 + Math.random() * 0.3
      const r = 2.5 + Math.random() * 1.5
      const x = center.x + Math.cos(angle) * r
      const z = center.z + Math.sin(angle) * r
      points.push(new THREE.Vector2(x, z))
    }
    points.push(points[0].clone())
    return points
  })
}

// 初始化 Three.js 场景
const initThree = () => {
  if (!canvasContainer.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a3b2f)
  scene.fog = new THREE.Fog(0x1a3b2f, 30, 90)

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(22, 16, 28)
  camera.lookAt(0, 1, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setPixelRatio(window.devicePixelRatio)
  canvasContainer.value.appendChild(renderer.domElement)

  labelRenderer = new CSS2DRenderer()
  labelRenderer.setSize(window.innerWidth, window.innerHeight)
  labelRenderer.domElement.style.position = 'absolute'
  labelRenderer.domElement.style.top = '0px'
  labelRenderer.domElement.style.left = '0px'
  labelRenderer.domElement.style.pointerEvents = 'none'
  canvasContainer.value.appendChild(labelRenderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.6
  controls.maxPolarAngle = Math.PI / 2.2
  controls.target.set(0, 1, 0)

  // 灯光
  const ambientLight = new THREE.AmbientLight(0x405030)
  scene.add(ambientLight)

  const sunLight = new THREE.DirectionalLight(0xffeedd, 1.3)
  sunLight.position.set(20, 30, 15)
  sunLight.castShadow = true
  sunLight.receiveShadow = true
  sunLight.shadow.mapSize.width = 1024
  sunLight.shadow.mapSize.height = 1024
  const d = 35
  sunLight.shadow.camera.left = -d
  sunLight.shadow.camera.right = d
  sunLight.shadow.camera.top = d
  sunLight.shadow.camera.bottom = -d
  sunLight.shadow.camera.near = 1
  sunLight.shadow.camera.far = 70
  sunLight.shadow.bias = -0.0005
  scene.add(sunLight)

  const backLight = new THREE.DirectionalLight(0x88aaff, 0.4)
  backLight.position.set(-15, 10, -20)
  scene.add(backLight)

  const fillLight = new THREE.PointLight(0xffaa55, 0.5, 40)
  fillLight.position.set(10, 15, 15)
  scene.add(fillLight)

  // 基础地面
  const baseGroundMat = new THREE.MeshStandardMaterial({ color: 0x2d4a2d, roughness: 0.8 })
  const baseGroundGeo = new THREE.CircleGeometry(30, 32)
  const baseGround = new THREE.Mesh(baseGroundGeo, baseGroundMat)
  baseGround.rotation.x = -Math.PI / 2
  baseGround.position.y = -0.05
  baseGround.receiveShadow = true
  scene.add(baseGround)

  // 装饰网格
  const gridHelper = new THREE.GridHelper(40, 20, 0xccaa88, 0x6b4f3c)
  gridHelper.position.y = 0
  gridHelper.material.opacity = 0.2
  gridHelper.material.transparent = true
  scene.add(gridHelper)

  // 背景粒子
  const starsGeometry = new THREE.BufferGeometry()
  const starsCount = 400
  const starPositions = new Float32Array(starsCount * 3)
  for (let i = 0; i < starsCount; i++) {
    starPositions[i*3] = (Math.random() - 0.5) * 200
    starPositions[i*3+1] = (Math.random() - 0.5) * 100
    starPositions[i*3+2] = (Math.random() - 0.5) * 200 - 30
  }
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  const starsMaterial = new THREE.PointsMaterial({ color: 0xffdd88, size: 0.25, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending })
  stars = new THREE.Points(starsGeometry, starsMaterial)
  scene.add(stars)

  // 漂浮粒子
  const pollenGeo = new THREE.BufferGeometry()
  const pollenPositions = []
  for (let i = 0; i < 120; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = 7 + Math.random() * 8
    const y = 0.5 + Math.random() * 4
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    pollenPositions.push(x, y, z)
  }
  pollenGeo.setAttribute('position', new THREE.Float32BufferAttribute(pollenPositions, 3))
  const pollenMat = new THREE.PointsMaterial({ color: 0xffdd88, size: 0.1, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending })
  pollen = new THREE.Points(pollenGeo, pollenMat)
  scene.add(pollen)

  // 射线检测器
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // 生成种植区
  const zones = generateZones()
  const polygons = generatePolygons(zones.length)

  // 创建种植区拼块
  zones.forEach((zone, index) => {
    const points = polygons[index]
    
    const shape = new THREE.Shape(points)
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: zone.baseHeight,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2
    })
    
    geo.center()
    
    const mat = new THREE.MeshStandardMaterial({
      color: zone.color,
      roughness: 0.5,
      metalness: 0.1,
      emissive: new THREE.Color(0x221100),
      emissiveIntensity: 0.1,
      flatShading: false,
      side: THREE.DoubleSide
    })
    
    const mesh = new THREE.Mesh(geo, mat)
    
    // 计算中心位置
    let centerX = 0, centerZ = 0
    points.forEach(p => {
      centerX += p.x
      centerZ += p.y
    })
    centerX /= points.length
    centerZ /= points.length
    
    mesh.position.set(centerX, zone.baseHeight/2, centerZ)
    
    mesh.userData = {
      name: zone.name,
      shortName: zone.shortName,
      variety: zone.variety,
      area: zone.area,
      trees: zone.trees,
      yield: zone.yield,
      density: zone.density,
      index: index,
      baseHeight: zone.baseHeight,
      hoverHeight: zone.hoverHeight,
      centerX: centerX,
      centerZ: centerZ,
      isHovered: false,
      points: points
    }
    
    mesh.castShadow = true
    mesh.receiveShadow = true
    
    scene.add(mesh)
    zoneMeshes.push(mesh)

    // 水果标志
    const fruitMat = new THREE.MeshStandardMaterial({ 
      color: 0xffaa33, 
      emissive: new THREE.Color(0x442200),
      emissiveIntensity: 0.3
    })
    const fruitGeo = new THREE.SphereGeometry(0.25, 16)
    const fruit = new THREE.Mesh(fruitGeo, fruitMat)
    fruit.castShadow = true
    fruit.position.set(centerX, zone.baseHeight + 0.15, centerZ)
    scene.add(fruit)

    // 小草
    for (let j = 0; j < 4; j++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 2.0 + Math.random() * 1.0
      const smallX = centerX + Math.cos(angle) * dist
      const smallZ = centerZ + Math.sin(angle) * dist
      
      const grassGeo = new THREE.ConeGeometry(0.1, 0.2, 4)
      const grassMat = new THREE.MeshStandardMaterial({ color: 0x5a8f5a })
      const grass = new THREE.Mesh(grassGeo, grassMat)
      grass.position.set(smallX, 0.1, smallZ)
      grass.castShadow = true
      scene.add(grass)
    }

    // CSS2D标签
    const labelDiv = document.createElement('div')
    labelDiv.textContent = zone.shortName + '区'
    labelDiv.style.color = '#fff'
    labelDiv.style.fontSize = '14px'
    labelDiv.style.fontWeight = 'bold'
    labelDiv.style.textShadow = '2px 2px 6px black'
    labelDiv.style.background = 'rgba(100, 60, 20, 0.8)'
    labelDiv.style.padding = '2px 8px'
    labelDiv.style.borderRadius = '16px'
    labelDiv.style.border = '1px solid #ffaa33'
    labelDiv.style.whiteSpace = 'nowrap'
    labelDiv.style.backdropFilter = 'blur(4px)'
    
    const label = new CSS2DObject(labelDiv)
    label.position.set(centerX, zone.baseHeight + 0.6, centerZ)
    scene.add(label)
    
    mesh.userData.label = label
  })

  // 添加随机果树
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = 11 + Math.random() * 7
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.0)
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
    const trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.position.set(x, 0.5, z)
    trunk.castShadow = true
    trunk.receiveShadow = true
    scene.add(trunk)
    
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x6a9e6a })
    const leafGeo = new THREE.SphereGeometry(0.3, 5)
    const leaf = new THREE.Mesh(leafGeo, leafMat)
    leaf.position.set(x, 1.0, z)
    leaf.castShadow = true
    scene.add(leaf)
  }

  // 事件监听
  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('click', onClick)

  // 开始动画
  animate()
}

// 鼠标移动处理
const onMouseMove = (event) => {
  if (!renderer || !camera) return

  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(zoneMeshes)

  if (intersects.length > 0) {
    const hovered = intersects[0].object

    if (currentHovered !== hovered) {
      if (currentHovered) {
        const prevData = currentHovered.userData
        currentHovered.scale.y = 1
        currentHovered.position.y = prevData.baseHeight / 2
        if (prevData.label) {
          prevData.label.position.y = prevData.baseHeight + 0.6
        }
        currentHovered.material.emissive.setHex(0x221100)
        currentHovered.material.emissiveIntensity = 0.1
      }

      currentHovered = hovered
      const data = hovered.userData

      hovered.scale.y = data.hoverHeight / data.baseHeight
      hovered.position.y = data.hoverHeight / 2

      if (data.label) {
        data.label.position.y = data.hoverHeight + 0.6
      }

      hovered.material.emissive.setHex(0x442200)
      hovered.material.emissiveIntensity = 0.3
    }
  } else {
    if (currentHovered) {
      const data = currentHovered.userData
      currentHovered.scale.y = 1
      currentHovered.position.y = data.baseHeight / 2
      if (data.label) {
        data.label.position.y = data.baseHeight + 0.6
      }
      currentHovered.material.emissive.setHex(0x221100)
      currentHovered.material.emissiveIntensity = 0.1
      currentHovered = null
    }
  }
}

// 点击处理
const onClick = (event) => {
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(zoneMeshes)

  if (intersects.length > 0) {
    const hitZone = intersects[0].object
    const data = hitZone.userData

    selectedZone.value = data
    showDetail.value = true

    controls.autoRotate = false
    setTimeout(() => {
      controls.autoRotate = true
    }, 5000)
  } else {
    hideDetail()
  }
}

// 显示/隐藏详情
const showZoneDetail = (data) => {
  selectedZone.value = data
  showDetail.value = true
}

const hideDetail = () => {
  showDetail.value = false
  selectedZone.value = null
}

// 动画循环
const animate = () => {
  if (controls) controls.update()
  if (stars) stars.rotation.y += 0.0002
  if (pollen) pollen.rotation.y += 0.0005
  
  if (renderer && scene && camera && labelRenderer) {
    renderer.render(scene, camera)
    labelRenderer.render(scene, camera)
  }
  
  animationId = requestAnimationFrame(animate)
}

// 窗口大小自适应
const handleResize = () => {
  if (!camera || !renderer || !labelRenderer) return
  
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  labelRenderer.setSize(window.innerWidth, window.innerHeight)
}

// 生命周期钩子
onMounted(() => {
  initThree()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (renderer && renderer.domElement) {
    renderer.domElement.removeEventListener('mousemove', onMouseMove)
    renderer.domElement.removeEventListener('click', onClick)
  }
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  // 清理 Three.js 资源
  if (scene) {
    scene.clear()
  }
})
</script>

<style scoped>
.orchard-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Microsoft YaHei', sans-serif;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.info-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 12px 24px;
  border-radius: 30px;
  pointer-events: none;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  border-left: 5px solid #ffaa00;
  backdrop-filter: blur(5px);
}

.info-panel h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 400;
  letter-spacing: 2px;
}

.info-panel h1 span {
  font-weight: 700;
  color: #ffaa00;
  margin-left: 10px;
}

.info-panel p {
  margin: 5px 0 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

.fixed-title {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(145deg, #6b4f3c, #8b5e3c);
  color: #ffd966;
  padding: 16px 48px;
  border-radius: 60px;
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: 8px;
  text-shadow: 0 4px 15px rgba(0,0,0,0.7), 0 0 20px #ffb347;
  border: 2px solid #ff8c42;
  box-shadow: 0 10px 30px rgba(0,0,0,0.6);
  z-index: 200;
  backdrop-filter: blur(4px);
  white-space: nowrap;
  pointer-events: none;
}

.fixed-title::before {
  content: "🍎";
  margin-right: 20px;
  font-size: 2.2rem;
  filter: drop-shadow(0 2px 5px #ff6b6b);
}

.fixed-title::after {
  content: "🍊";
  margin-left: 20px;
  font-size: 2.2rem;
  filter: drop-shadow(0 2px 5px #ffaa00);
}

.stats-panel {
  position: absolute;
  bottom: 30px;
  right: 30px;
  background: rgba(50, 30, 20, 0.85);
  color: #eee;
  padding: 18px 25px;
  border-radius: 16px;
  backdrop-filter: blur(8px);
  border: 1px solid #ffaa00;
  box-shadow: 0 10px 30px rgba(0,0,0,0.6);
  z-index: 100;
  pointer-events: none;
  line-height: 1.8;
  font-size: 1rem;
  border-right: 4px solid #ff6b4a;
}

.stats-panel .title {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffaa00;
  margin-bottom: 8px;
  border-bottom: 1px solid #b37b5b;
  padding-bottom: 5px;
}

.stats-panel .item {
  display: flex;
  justify-content: space-between;
  gap: 40px;
}

.stats-panel .item .label {
  color: #ccc;
}

.stats-panel .item .value {
  font-weight: 600;
  color: #ffaa00;
}

.stats-panel .highlight {
  color: #ffaa00;
  font-weight: 700;
}

.stats-panel .note {
  margin-top: 10px;
  font-size: 0.9rem;
  color: #ccc;
  border-top: 1px solid #b37b5b;
  padding-top: 8px;
}

.detail-modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(60, 40, 20, 0.95);
  backdrop-filter: blur(10px);
  color: white;
  padding: 30px 40px;
  border-radius: 30px;
  border: 2px solid #ffaa00;
  box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255, 170, 0, 0.5);
  z-index: 1000;
  min-width: 350px;
  text-align: left;
  transition: all 0.3s ease;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
}

.detail-modal.show {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.detail-modal .zone-name {
  font-size: 2.2rem;
  font-weight: 800;
  color: #ffaa00;
  margin-bottom: 15px;
  border-bottom: 2px solid #ff8c42;
  padding-bottom: 10px;
  text-shadow: 0 2px 10px rgba(255,140,0,0.5);
}

.detail-modal .detail-item {
  display: flex;
  justify-content: space-between;
  margin: 15px 0;
  font-size: 1.3rem;
  padding: 8px 15px;
  background: rgba(255,255,255,0.1);
  border-radius: 40px;
  border-left: 4px solid #ffaa00;
}

.detail-modal .detail-item .label {
  color: #ddd;
  font-weight: 400;
}

.detail-modal .detail-item .value {
  font-weight: 700;
  color: #ffaa00;
}

.detail-modal .close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 2rem;
  cursor: pointer;
  color: #ffaa00;
  background: rgba(0,0,0,0.5);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  pointer-events: auto;
}

.detail-modal .close-btn:hover {
  background: #ffaa00;
  color: black;
  transform: scale(1.1);
}

.detail-modal .highlight-number {
  font-size: 1.6rem;
  color: #ffaa00;
  margin-left: 5px;
}

.detail-modal .modal-footer {
  text-align: center;
  margin-top: 20px;
  color: #aaa;
  font-size: 0.9rem;
}

.hover-hint {
  position: absolute;
  top: 180px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 140, 0, 0.9);
  color: white;
  padding: 8px 20px;
  border-radius: 40px;
  font-size: 1rem;
  font-weight: bold;
  z-index: 150;
  pointer-events: none;
  animation: pulse 2s infinite;
  backdrop-filter: blur(4px);
  border: 1px solid #ffd966;
  transition: opacity 1s;
}

@keyframes pulse {
  0% { opacity: 0.7; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.05); background: rgba(255, 120, 0, 0.9); }
  100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
}

.controls-note {
  position: absolute;
  bottom: 20px;
  left: 20px;
  color: rgba(255,255,255,0.5);
  font-size: 0.8rem;
  background: rgba(0,0,0,0.3);
  padding: 4px 12px;
  border-radius: 20px;
  pointer-events: none;
  z-index: 100;
}
</style>