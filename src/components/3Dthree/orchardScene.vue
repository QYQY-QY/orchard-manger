<template>
  <div ref="canvasContainer" class="canvas-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'

// Props 和 Emits
const props = defineProps({
  showDetail: Boolean,
  selectedZone: Object
})

const emit = defineEmits(['update:showDetail', 'update:selectedZone', 'update:stats'])

// DOM 引用
const canvasContainer = ref(null)

// Three.js 变量
let scene, camera, renderer, labelRenderer, controls
let zoneMeshes = []
let currentHovered = null
let raycaster, mouse
let stars, pollen
let animationId

// 水果名称数据
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

// 获取颜色
const getZoneColor = (index) => {
  const colors = [
    0xffaa66, 0xff8c66, 0xffb366, 0xff9966, 0xffa57a, 0xffbb88, 0xffa56b
  ]
  return colors[index % colors.length]
}

// 生成随机数据
const generateZones = () => {
  const zoneCount = Math.floor(Math.random() * 4) + 4

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

  // 向父组件发送统计数据
  emit('update:stats', {
    zoneCount,
    totalArea,
    totalTrees,
    totalYield
  })

  return zones
}

// 生成多边形
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

  // 灯光设置
  setupLights()

  // 地面和装饰
  setupGroundAndDecorations()

  // 射线检测器
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // 生成种植区
  const zones = generateZones()
  const polygons = generatePolygons(zones.length)

  // 创建种植区拼块
  createZoneMeshes(zones, polygons)

  // 添加随机果树
  addRandomTrees()

  // 事件监听
  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('click', onClick)

  // 开始动画
  animate()
}

// 设置灯光
const setupLights = () => {
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
}

// 设置地面和装饰
const setupGroundAndDecorations = () => {
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
}

// 创建种植区网格
const createZoneMeshes = (zones, polygons) => {
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
}

// 添加随机果树
const addRandomTrees = () => {
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

    emit('update:selectedZone', data)
    emit('update:showDetail', true)

    controls.autoRotate = false
    setTimeout(() => {
      controls.autoRotate = true
    }, 5000)
  } else {
    emit('update:showDetail', false)
    emit('update:selectedZone', null)
  }
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

// 生命周期
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
.canvas-container {
  width: 100%;
  height: 100%;
}
</style>