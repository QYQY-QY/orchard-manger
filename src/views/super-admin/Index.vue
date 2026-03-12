<template>
  <div class="orchard-container">
    <!-- 加载提示 -->
    <div ref="loadingEl" id="loading">
      <span>🌌 生成150顶点果园 · 炫光地块 ...</span>
    </div>

    <!-- 信息面板 -->
    <div id="info">
      <h1>🍊 <span>60亩 · 150顶点果园</span> 🍊</h1>
      <p>
        <span style="color:#88ccff">● 圆润梯形边界</span>
        | 地面粒子 | 发光边缘
      </p>
    </div>

    <!-- 控制面板 -->
    <div id="controls-panel">
      <div><span class="dot"></span> 150个控制点</div>
      <div>🖱️ 拖动 | 滚轮缩放</div>
    </div>

    <!-- 调试信息 -->
    <div ref="debugEl" id="debug-info">
      初始化...
    </div>

    <!-- Three.js 画布容器 -->
    <div ref="canvasContainer" class="canvas-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// DOM 引用
const loadingEl = ref(null);
const debugEl = ref(null);
const canvasContainer = ref(null);

// Three 核心变量
let scene, camera, renderer, labelRenderer, controls, stars, floatingParticles;
let animationId;

// --- 工具函数：生成150个点的多边形（圆润梯形） ---
function generateOrchardPoints() {
  const numPoints = 150;                // 顶点数
  const baseRx = 13.5;                   // 水平半径
  const baseRy = 10.5;                   // 垂直半径
  const trapezoidFactor = 0.25;          // 梯形因子（减小使更圆润）

  const points2D = [];

  for (let i = 0; i < numPoints; i++) {
    // 均匀角度 + 极小随机扰动（使边界平滑自然）
    const t = (i / numPoints) * Math.PI * 2;
    const angle = t + (Math.random() - 0.5) * 0.02; // 扰动±0.02弧度

    // 基础椭圆
    let x = baseRx * Math.cos(angle);
    let y = baseRy * Math.sin(angle);

    // 梯形修正：上部收缩，下部扩张
    y = y * (1 - trapezoidFactor * Math.sin(angle));

    // 径向噪声（幅度很小，0.97~1.03，使边界圆润）
    const radialNoise = 0.97 + Math.random() * 0.06;
    x *= radialNoise;
    y *= radialNoise;

    points2D.push(new THREE.Vector2(x, y));
  }

  return points2D;
}

// --- 创建炫酷果园地块 ---
function createCoolOrchard() {
  const points2D = generateOrchardPoints();
  const polyPoints = points2D.map(p => [p.x, p.y]);

  // 创建 Shape 并挤出几何体
  const shape = new THREE.Shape(points2D);
  const extrudeSettings = {
    depth: 1.5,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.2,
    bevelSegments: 4
  };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // 地块主材质：半透明发光质感
  const material = new THREE.MeshStandardMaterial({
    color: 0x4a7db5,
    emissive: 0x1a2a4a,
    roughness: 0.3,
    metalness: 0.2,
    side: THREE.DoubleSide,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.95
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // 多层发光边缘
  const edges = new THREE.EdgesGeometry(geometry);
  const line1 = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x88ccff }));
  line1.rotation.copy(mesh.rotation);
  line1.position.copy(mesh.position);
  scene.add(line1);

  const line2 = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xff88aa, opacity: 0.5, transparent: true }));
  line2.rotation.copy(mesh.rotation);
  line2.position.set(mesh.position.x, mesh.position.y + 0.15, mesh.position.z);
  scene.add(line2);

  const line3 = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xaaccff, opacity: 0.3, transparent: true }));
  line3.rotation.copy(mesh.rotation);
  line3.position.set(mesh.position.x, mesh.position.y + 0.3, mesh.position.z);
  scene.add(line3);

  if (debugEl.value) {
    debugEl.value.innerHTML = `✨ 150顶点 | 圆润梯形 | 面积约60亩`;
  }

  // 中心发光标签
  const labelDiv = document.createElement('div');
  labelDiv.className = 'orchard-label';
  labelDiv.innerHTML = `
    <div>🍊 60亩果园</div>
    <div style="font-size:12px; color:#aaddff;">150个控制点</div>
  `;
  const label = new CSS2DObject(labelDiv);
  label.position.set(0, 3.0, 0);
  scene.add(label);

  // 隐藏加载提示
  if (loadingEl.value) {
    loadingEl.value.style.opacity = '0';
    setTimeout(() => {
      if (loadingEl.value) loadingEl.value.style.display = 'none';
    }, 500);
  }
}

// --- 初始化场景（星空、粒子、灯光）---
function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a20);
  scene.fog = new THREE.Fog(0x0a0a20, 40, 120);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5, 25, 45);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvasContainer.value.appendChild(renderer.domElement);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.left = '0px';
  labelRenderer.domElement.style.pointerEvents = 'none';
  canvasContainer.value.appendChild(labelRenderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.3;
  controls.enableZoom = true;
  controls.target.set(0, 2, 0);
  controls.maxPolarAngle = Math.PI / 2.2;

  // 灯光系统
  const ambient = new THREE.AmbientLight(0x404060);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
  dirLight.position.set(10, 30, 20);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  const d = 30;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 60;
  scene.add(dirLight);

  const backLight = new THREE.PointLight(0x4488ff, 0.6);
  backLight.position.set(-10, 15, -20);
  scene.add(backLight);

  const colors = [0xffaa33, 0x33aaff, 0x88ff88];
  for (let i = 0; i < 3; i++) {
    const light = new THREE.PointLight(colors[i], 0.5, 30);
    light.position.set(8 * Math.cos(i * 2.0), 5 + i * 3, 8 * Math.sin(i * 2.0));
    scene.add(light);
  }

  // 地面光晕
  const groundGlowMat = new THREE.MeshStandardMaterial({
    color: 0x224466,
    emissive: 0x112233,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  });
  const groundGlow = new THREE.Mesh(new THREE.CircleGeometry(25, 32), groundGlowMat);
  groundGlow.rotation.x = -Math.PI / 2;
  groundGlow.position.y = -0.2;
  scene.add(groundGlow);

  // 星空背景
  const starsGeom = new THREE.BufferGeometry();
  const starsCount = 4000;
  const starPos = new Float32Array(starsCount * 3);
  for (let i = 0; i < starsCount; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 1000;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 1000;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 1000 - 300;
  }
  starsGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starsMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.4,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });
  stars = new THREE.Points(starsGeom, starsMat);
  scene.add(stars);

  // --- 漂浮粒子（现在放在下方，贴近地面）---
  const particleCount = 600;
  const particleGeom = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    // 粒子分布在果园周围，Y轴高度控制在0.5~4.5之间，贴近地面
    particlePositions[i * 3] = (Math.random() - 0.5) * 70;
    particlePositions[i * 3 + 1] = 0.5 + Math.random() * 4; // 0.5~4.5
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 70;
    const hue = 0.65 + Math.random() * 0.25; // 蓝紫到粉紫
    const col = new THREE.Color().setHSL(hue, 0.8, 0.6);
    particleColors[i * 3] = col.r;
    particleColors[i * 3 + 1] = col.g;
    particleColors[i * 3 + 2] = col.b;
  }
  particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
  const particleMat = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });
  floatingParticles = new THREE.Points(particleGeom, particleMat);
  scene.add(floatingParticles);
}

// 动画循环
function animate() {
  animationId = requestAnimationFrame(animate);

  if (stars) stars.rotation.y += 0.0001;
  if (floatingParticles) {
    const time = Date.now() * 0.001;
    const positions = floatingParticles.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
      // 让粒子缓慢上下浮动
      positions[i] += Math.sin(time + positions[i - 1]) * 0.001;
    }
    floatingParticles.geometry.attributes.position.needsUpdate = true;
    floatingParticles.rotation.y += 0.0003;
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

// 窗口自适应
function onWindowResize() {
  if (camera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  renderer?.setSize(window.innerWidth, window.innerHeight);
  labelRenderer?.setSize(window.innerWidth, window.innerHeight);
}

onMounted(() => {
  initScene();
  createCoolOrchard();
  animate();
  window.addEventListener('resize', onWindowResize);
});

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onWindowResize);
  renderer?.dispose();
  labelRenderer?.domElement.remove();
  scene?.clear();
});
</script>

<style scoped>
.orchard-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  font-family: "Microsoft YaHei", sans-serif;
}
.canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
#info {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 16px 28px;
  border-radius: 50px;
  z-index: 100;
  backdrop-filter: blur(10px);
  border-left: 6px solid #88aaff;
  box-shadow: 0 0 30px #88aaff66;
  border: 1px solid #88aaff;
}
#info h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 1px;
  text-shadow: 0 0 15px #88aaff;
}
#info h1 span {
  color: #88aaff;
  font-weight: bold;
  margin: 0 8px;
}
#info p {
  margin: 8px 0 0;
  font-size: 15px;
  color: #ddd;
  display: flex;
  align-items: center;
  gap: 15px;
}
#controls-panel {
  position: absolute;
  bottom: 30px;
  right: 30px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 12px 22px;
  border-radius: 40px;
  font-size: 14px;
  z-index: 100;
  backdrop-filter: blur(10px);
  border: 1px solid #88aaff;
  box-shadow: 0 0 20px #88aaff;
  display: flex;
  gap: 20px;
}
#controls-panel .dot {
  width: 12px;
  height: 12px;
  background: #88aaff;
  border-radius: 50%;
  box-shadow: 0 0 15px #88aaff;
}
#loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 18px;
  background: rgba(0, 0, 0, 0.8);
  padding: 20px 40px;
  border-radius: 60px;
  z-index: 1000;
  backdrop-filter: blur(8px);
  border: 1px solid #88aaff;
  box-shadow: 0 0 40px #88aaff;
  transition: opacity 0.5s;
}
#debug-info {
  position: absolute;
  bottom: 30px;
  left: 30px;
  background: rgba(0, 0, 0, 0.6);
  color: #aaddff;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 12px;
  z-index: 100;
  font-family: monospace;
  backdrop-filter: blur(5px);
  border: 1px solid #88aaff;
  box-shadow: 0 0 15px #88aaff;
}
/* 果园标签样式 */
.orchard-label {
  background: rgba(30, 40, 70, 0.9);
  color: white;
  padding: 10px 20px;
  border-radius: 40px;
  text-align: center;
  backdrop-filter: blur(4px);
  border: 2px solid #88aaff;
  box-shadow: 0 0 30px #88aaff;
  font-family: 'Arial', sans-serif;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  font-size: 18px;
  font-weight: bold;
}
.orchard-label::before {
  content: '✨';
  margin-right: 8px;
  font-size: 20px;
}
</style>