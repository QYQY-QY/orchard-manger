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
let trees = []
let animationId

// 水果名称数据
const fruitNames = [
  { name: "🍎 红富士苹果", variety: "红富士", treeColor: 0x2d5a27, fruitColor: 0xff4444 },
  { name: "🍐 黄金梨", variety: "黄金梨", treeColor: 0x3a6b3a, fruitColor: 0xffee88 },
  { name: "🍑 水蜜桃", variety: "水蜜桃", treeColor: 0x2e5a2e, fruitColor: 0xffaaaa },
  { name: "🍊 脐橙", variety: "脐橙", treeColor: 0x2d5a27, fruitColor: 0xffaa22 },
  { name: "🍒 樱桃", variety: "樱桃", treeColor: 0x3a5a3a, fruitColor: 0xcc2222 }
]

// 生成随机数据
const generateZones = () => {
  const zoneCount = 5
  const zones = fruitNames.slice(0, zoneCount).map((fruit, index) => ({
    ...fruit,
    shortName: fruit.name.split(' ')[1] || fruit.variety,
    area: Math.floor(80 + Math.random() * 120),
    trees: Math.floor(1500 + Math.random() * 4000),
    yield: Math.floor(30 + Math.random() * 120),
    density: 0,
    baseHeight: 0.1,
    hoverHeight: 0.4,
    color: 0x4a7c4a
  }))

  zones.forEach(zone => {
    zone.density = Math.round(zone.trees / zone.area * 10) / 10
  })

  const totalArea = zones.reduce((sum, z) => sum + z.area, 0)
  const totalTrees = zones.reduce((sum, z) => sum + z.trees, 0)
  const totalYield = zones.reduce((sum, z) => sum + z.yield, 0)

  emit('update:stats', { zoneCount, totalArea, totalTrees, totalYield })
  return zones
}

// 生成横向排列的地块
const generatePolygons = (zoneCount) => {
  const centerPoints = []
  const rowOffset = 10
  const colInterval = 14
  const startX = -(zoneCount * colInterval) / 2

  for (let i = 0; i < zoneCount; i++) {
    const z = i % 2 === 0 ? -rowOffset/2 : rowOffset/2
    const x = startX + i * colInterval
    centerPoints.push({ x, z, index: i })
  }

  return centerPoints.map((center) => {
    const points = []
    const width = 6
    const depth = 4
    // 稍微不规则的边缘，更自然
    points.push(new THREE.Vector2(center.x - width/2 + Math.random()*0.3, center.z - depth/2 + Math.random()*0.3))
    points.push(new THREE.Vector2(center.x + width/2 + Math.random()*0.3, center.z - depth/2 + Math.random()*0.3))
    points.push(new THREE.Vector2(center.x + width/2 + Math.random()*0.3, center.z + depth/2 + Math.random()*0.3))
    points.push(new THREE.Vector2(center.x - width/2 + Math.random()*0.3, center.z + depth/2 + Math.random()*0.3))
    points.push(points[0].clone())
    return points
  })
}

// 初始化场景
const initThree = () => {
  if (!canvasContainer.value) return

  scene = new THREE.Scene()
  
  // ========== 1. 真实天空盒 ==========
  const skyGeo = new THREE.SphereGeometry(200, 32, 32)
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x87CEEB) },
      bottomColor: { value: new THREE.Color(0xE0F6FF) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide
  })
  const sky = new THREE.Mesh(skyGeo, skyMat)
  scene.add(sky)

  // 相机
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500)
  camera.position.set(0, 18, 30)
  camera.lookAt(0, 0, 0)

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  canvasContainer.value.appendChild(renderer.domElement)

  // CSS2D渲染器
  labelRenderer = new CSS2DRenderer()
  labelRenderer.setSize(window.innerWidth, window.innerHeight)
  labelRenderer.domElement.style.position = 'absolute'
  labelRenderer.domElement.style.top = '0px'
  labelRenderer.domElement.style.left = '0px'
  labelRenderer.domElement.style.pointerEvents = 'none'
  canvasContainer.value.appendChild(labelRenderer.domElement)

  // 控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.2
  controls.maxPolarAngle = Math.PI / 2.1
  controls.minDistance = 10
  controls.maxDistance = 80
  controls.target.set(0, 2, 0)

  // ========== 2. 真实光照系统 ==========
  setupLights()

  // ========== 3. 真实地面 ==========
  setupGround()

  // 射线检测
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // 生成种植区
  const zones = generateZones()
  const polygons = generatePolygons(zones.length)
  createZoneMeshes(zones, polygons)

  // 事件监听
  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('click', onClick)
  window.addEventListener('resize', handleResize)

  animate()
}

// 真实光照
const setupLights = () => {
  // 环境光
  const ambient = new THREE.HemisphereLight(0x87CEEB, 0x3d5c3d, 0.6)
  scene.add(ambient)

  // 主太阳光
  const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2)
  sunLight.position.set(30, 50, 20)
  sunLight.castShadow = true
  sunLight.shadow.mapSize.width = 2048
  sunLight.shadow.mapSize.height = 2048
  sunLight.shadow.camera.near = 0.5
  sunLight.shadow.camera.far = 150
  sunLight.shadow.camera.left = -50
  sunLight.shadow.camera.right = 50
  sunLight.shadow.camera.top = 50
  sunLight.shadow.camera.bottom = -50
  sunLight.shadow.bias = -0.0001
  sunLight.shadow.normalBias = 0.01
  scene.add(sunLight)

  // 补光
  const fillLight = new THREE.DirectionalLight(0xaaccff, 0.3)
  fillLight.position.set(-20, 20, -10)
  scene.add(fillLight)
}

// 真实地面
const setupGround = () => {
  // 主地面
  const groundGeo = new THREE.PlaneGeometry(200, 200, 100, 100)
  // 给地面添加一些起伏
  const vertices = groundGeo.attributes.position.array
  for (let i = 0; i < vertices.length; i += 3) {
    vertices[i + 2] = Math.random() * 0.1
  }
  groundGeo.computeVertexNormals()

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x4a7c4a,
    roughness: 0.9,
    metalness: 0.0
  })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // 远处的草地装饰
  const grassGeo = new THREE.PlaneGeometry(200, 200)
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x5a8c5a,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  })
  const grass = new THREE.Mesh(grassGeo, grassMat)
  grass.rotation.x = -Math.PI / 2
  grass.position.y = 0.01
  scene.add(grass)

  // 网格辅助线（淡化）
  const grid = new THREE.GridHelper(100, 50, 0x5a8c5a, 0x4a7c4a)
  grid.material.opacity = 0.15
  grid.material.transparent = true
  scene.add(grid)
}

// 创建真实的果树
const createRealisticTree = (x, z, zoneData) => {
  const treeGroup = new THREE.Group()
  
  // 树干
  const trunkHeight = 1.5 + Math.random() * 0.5
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, trunkHeight, 8)
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5d4037,
    roughness: 0.9,
    metalness: 0.0
  })
  const trunk = new THREE.Mesh(trunkGeo, trunkMat)
  trunk.position.y = trunkHeight / 2
  trunk.castShadow = true
  trunk.receiveShadow = true
  treeGroup.add(trunk)

  // 多层树叶（更真实的树冠）
  const leafColors = [zoneData.treeColor, zoneData.treeColor + 0x111111, zoneData.treeColor - 0x111111]
  const leafPositions = [
    { y: trunkHeight + 0.3, scale: 1.2 },
    { y: trunkHeight + 0.8, scale: 0.9 },
    { y: trunkHeight + 1.2, scale: 0.6 }
  ]

  leafPositions.forEach((pos, i) => {
    const leafGeo = new THREE.SphereGeometry(0.6 * pos.scale, 8, 6)
    // 变形树叶，更自然
    const leafVerts = leafGeo.attributes.position.array
    for (let j = 0; j < leafVerts.length; j += 3) {
      leafVerts[j] *= 1 + Math.random() * 0.2
      leafVerts[j+1] *= 0.8 + Math.random() * 0.4
      leafVerts[j+2] *= 1 + Math.random() * 0.2
    }
    leafGeo.computeVertexNormals()

    const leafMat = new THREE.MeshStandardMaterial({
      color: leafColors[i % leafColors.length],
      roughness: 0.8,
      metalness: 0.0
    })
    const leaves = new THREE.Mesh(leafGeo, leafMat)
    leaves.position.y = pos.y
    leaves.castShadow = true
    leaves.receiveShadow = true
    treeGroup.add(leaves)
  })

  // 添加水果（如果是结果季节）
  if (Math.random() > 0.5) {
    const fruitCount = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < fruitCount; i++) {
      const fruitGeo = new THREE.SphereGeometry(0.08, 8, 8)
      const fruitMat = new THREE.MeshStandardMaterial({
        color: zoneData.fruitColor,
        roughness: 0.5,
        metalness: 0.1
      })
      const fruit = new THREE.Mesh(fruitGeo, fruitMat)
      fruit.position.set(
        (Math.random() - 0.5) * 0.8,
        trunkHeight + 0.5 + Math.random() * 0.6,
        (Math.random() - 0.5) * 0.8
      )
      fruit.castShadow = true
      treeGroup.add(fruit)
    }
  }

  treeGroup.position.set(x, 0, z)
  treeGroup.rotation.y = Math.random() * Math.PI * 2
  return treeGroup
}

// 创建地块
const createZoneMeshes = (zones, polygons) => {
  zones.forEach((zone, index) => {
    const points = polygons[index]
    
    // 创建地块形状
    const shapePoints = points.map(p => new THREE.Vector2(p.x, p.y))
    const shape = new THREE.Shape(shapePoints)
    
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: zone.baseHeight,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 1
    })
    
    geo.rotateX(-Math.PI / 2)
    geo.computeBoundingBox()
    const center = new THREE.Vector3()
    geo.boundingBox.getCenter(center)
    geo.translate(-center.x, -center.y, -center.z)
    
    // 泥土材质
    const mat = new THREE.MeshStandardMaterial({
      color: 0x6b5a4a,
      roughness: 0.95,
      metalness: 0.0
    })
    
    const mesh = new THREE.Mesh(geo, mat)
    
    // 计算中心
    let centerX = 0, centerZ = 0
    points.forEach(p => {
      centerX += p.x
      centerZ += p.y
    })
    centerX /= points.length
    centerZ /= points.length
    
    mesh.position.set(centerX, zone.baseHeight/2, centerZ)
    
    mesh.userData = {
      ...zone,
      centerX, centerZ,
      isHovered: false,
      points
    }
    
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
    zoneMeshes.push(mesh)

    // 在这个地块上种植果树
    const treeCount = 15 + Math.floor(Math.random() * 10)
    for (let i = 0; i < treeCount; i++) {
      // 在地块范围内随机位置
      const minX = Math.min(...points.map(p => p.x))
      const maxX = Math.max(...points.map(p => p.x))
      const minZ = Math.min(...points.map(p => p.y))
      const maxZ = Math.max(...points.map(p => p.y))
      
      const tx = minX + Math.random() * (maxX - minX)
      const tz = minZ + Math.random() * (maxZ - minZ)
      
      const tree = createRealisticTree(tx, tz, zone)
      scene.add(tree)
      trees.push(tree)
    }

    // 标签
    const labelDiv = document.createElement('div')
    labelDiv.className = 'zone-label'
    labelDiv.innerHTML = `
      <div class="label-content">
        <span class="label-emoji">${zone.name.split(' ')[0]}</span>
        <span class="label-text">${zone.shortName}区</span>
      </div>
    `
    const label = new CSS2DObject(labelDiv)
    label.position.set(centerX, 3, centerZ)
    scene.add(label)
    mesh.userData.label = label
  })
}

// 鼠标移动
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
      // 恢复之前的
      if (currentHovered) {
        const prevData = currentHovered.userData
        currentHovered.scale.y = 1
        currentHovered.position.y = prevData.baseHeight / 2
        if (prevData.label) prevData.label.position.y = 3
        currentHovered.material.color.setHex(0x6b5a4a)
      }

      // 高亮当前的
      currentHovered = hovered
      const data = hovered.userData
      hovered.scale.y = data.hoverHeight / data.baseHeight
      hovered.position.y = data.hoverHeight / 2
      if (data.label) data.label.position.y = 3 + data.hoverHeight
      hovered.material.color.setHex(0x8b7a6a)
    }
  } else {
    if (currentHovered) {
      const data = currentHovered.userData
      currentHovered.scale.y = 1
      currentHovered.position.y = data.baseHeight / 2
      if (data.label) data.label.position.y = 3
      currentHovered.material.color.setHex(0x6b5a4a)
      currentHovered = null
    }
  }
}

// 点击
const onClick = (event) => {
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(zoneMeshes)

  if (intersects.length > 0) {
    const hitZone = intersects[0].object
    emit('update:selectedZone', hitZone.userData)
    emit('update:showDetail', true)
    controls.autoRotate = false
    setTimeout(() => controls.autoRotate = true, 5000)
  } else {
    emit('update:showDetail', false)
    emit('update:selectedZone', null)
  }
}

// 动画
const animate = () => {
  animationId = requestAnimationFrame(animate)
  controls.update()
  
  // 风吹树叶效果
  trees.forEach((tree, i) => {
    tree.rotation.z = Math.sin(Date.now() * 0.001 + i) * 0.02
  })
  
  renderer.render(scene, camera)
  labelRenderer.render(scene, camera)
}

// 窗口调整
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
  
  // 添加标签样式
  const style = document.createElement('style')
  style.textContent = `
    .zone-label {
      pointer-events: none;
      user-select: none;
    }
    .label-content {
      background: rgba(255,255,255,0.95);
      color: #2d5a27;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      gap: 8px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(45,90,39,0.2);
    }
    .label-emoji {
      font-size: 16px;
    }
  `
  document.head.appendChild(style)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (animationId) cancelAnimationFrame(animationId)
  if (scene) scene.clear()
})
</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
}
</style>