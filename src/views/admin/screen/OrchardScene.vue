<template>
  <div class="three-container">
    <!-- 去除左下角的标号提示 -->
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// ----- 三个地块的原始数据 (保持不变) -----
const plotsData = [
  {
    id: 1,
    boundaryPoints: [
      [119.8164, 28.8918], [119.8165, 28.8920], [119.8166, 28.8922], [119.8167, 28.8923], [119.8169, 28.8924],
      [119.8171, 28.8925], [119.8173, 28.8926], [119.8175, 28.8925], [119.8177, 28.8924], [119.8179, 28.8923],
      [119.8180, 28.8922], [119.8181, 28.8920], [119.8182, 28.8918], [119.8183, 28.8916], [119.8184, 28.8914],
      [119.8185, 28.8912], [119.8185, 28.8910], [119.8184, 28.8908], [119.8183, 28.8907], [119.8181, 28.8906],
      [119.8179, 28.8906], [119.8177, 28.8907], [119.8175, 28.8908], [119.8173, 28.8910], [119.8171, 28.8912],
      [119.8169, 28.8914], [119.8167, 28.8916], [119.8166, 28.8917], [119.8165, 28.8918], [119.8164, 28.8918]
    ]
  },
  {
    id: 2,
    boundaryPoints: [
      [119.8347, 28.8812], [119.8348, 28.8814], [119.8349, 28.8816], [119.8351, 28.8818], [119.8353, 28.8819],
      [119.8355, 28.8820], [119.8357, 28.8821], [119.8359, 28.8822], [119.8361, 28.8821], [119.8363, 28.8820],
      [119.8365, 28.8819], [119.8366, 28.8817], [119.8367, 28.8815], [119.8368, 28.8813], [119.8368, 28.8811],
      [119.8367, 28.8809], [119.8366, 28.8807], [119.8365, 28.8805], [119.8363, 28.8804], [119.8361, 28.8803],
      [119.8359, 28.8802], [119.8357, 28.8803], [119.8355, 28.8804], [119.8353, 28.8805], [119.8351, 28.8807],
      [119.8349, 28.8809], [119.8348, 28.8811], [119.8347, 28.8812], [119.8347, 28.8812]
    ]
  },
  {
    id: 3,
    boundaryPoints: [
      [119.8224, 28.8735], [119.8225, 28.8737], [119.8226, 28.8739], [119.8228, 28.8741], [119.8230, 28.8742],
      [119.8232, 28.8743], [119.8234, 28.8744], [119.8236, 28.8745], [119.8238, 28.8744], [119.8240, 28.8743],
      [119.8242, 28.8742], [119.8243, 28.8740], [119.8244, 28.8738], [119.8245, 28.8736], [119.8245, 28.8734],
      [119.8244, 28.8732], [119.8243, 28.8730], [119.8242, 28.8728], [119.8240, 28.8727], [119.8238, 28.8726],
      [119.8236, 28.8725], [119.8234, 28.8726], [119.8232, 28.8727], [119.8230, 28.8728], [119.8228, 28.8730],
      [119.8226, 28.8732], [119.8225, 28.8734], [119.8224, 28.8735], [119.8224, 28.8735]
    ]
  }
];

// 地块详细信息 - 科技蓝绿色系
const plotDetails = {
  1: {
    cropType: '水稻种植区',
    manager: '张明华',
    rating: 98,
    baseColor: 0x1a4d4d,
    highlightColor: 0x2a9d8f
  },
  2: {
    cropType: '茶叶种植区',
    manager: '李婉清',
    rating: 95,
    baseColor: 0x1a4d4d,
    highlightColor: 0x2a9d8f
  },
  3: {
    cropType: '果树种植区',
    manager: '王建国',
    rating: 92,
    baseColor: 0x1a4d4d,
    highlightColor: 0x2a9d8f
  }
};

// 状态管理
const selectedId = ref(null);
const hoveredId = ref(null);
const originalScales = new Map();
const glowLights = new Map();
const infoLabels = new Map();
const edgeGlowMeshes = new Map();

// 科技背景元素
let ringGroup;
let particleSystem;
let dataFlowLines;
let ambientParticles;
let waterRippleEffect; // 水波纹效果
let basePlateGroup = null; // 新增：大底座组

// 转换函数：XZ放大60倍，三个地块保持不交叉的距离
function transformWithNonOverlap() {
  const allPoints = [];
  plotsData.forEach(plot => {
    plot.boundaryPoints.forEach(p => allPoints.push({ lng: p[0], lat: p[1] }));
  });

  const lngs = allPoints.map(p => p.lng);
  const lats = allPoints.map(p => p.lat);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;

  const rangeLng = maxLng - minLng;
  const rangeLat = maxLat - minLat;
  const baseScale = 2.5 / Math.max(rangeLng, rangeLat);
  const totalZoom = 60.0;
  const finalScale = baseScale * totalZoom;

  const plotCenters = plotsData.map(plot => {
    let sumX = 0, sumZ = 0;
    plot.boundaryPoints.forEach(p => {
      // 直接映射：经度 -> X，纬度 -> Z，保持原始方向
      sumX += (p[0] - centerLng) * finalScale;
      sumZ += (p[1] - centerLat) * finalScale;
    });
    const count = plot.boundaryPoints.length;
    return { x: sumX / count, z: sumZ / count };
  });

  const plotRadii = plotsData.map((plot, index) => {
    const center = plotCenters[index];
    let maxDistSq = 0;
    plot.boundaryPoints.forEach(p => {
      const x = (p[0] - centerLng) * finalScale;
      const z = (p[1] - centerLat) * finalScale;
      const dx = x - center.x;
      const dz = z - center.z;
      const distSq = dx * dx + dz * dz;
      if (distSq > maxDistSq) maxDistSq = distSq;
    });
    return Math.sqrt(maxDistSq);
  });

  const avgRadius = (plotRadii[0] + plotRadii[1] + plotRadii[2]) / 3;
  const spacing = avgRadius * 1.5;

  const newCenters = [
    { x: -spacing * 0.9, z: -spacing * 0.5 },
    { x: spacing * 0.9, z: -spacing * 0.5 },
    { x: 0, z: spacing * 0.8 }
  ];

  const shifts = plotCenters.map((center, index) => ({
    x: newCenters[index].x - center.x,
    z: newCenters[index].z - center.z
  }));

  const meshesData = plotsData.map((plot, index) => {
    const points = plot.boundaryPoints.map(p => {
      let x = (p[0] - centerLng) * finalScale;
      let z = (p[1] - centerLat) * finalScale;
      x += shifts[index].x;
      z += shifts[index].z;
      return { x, z };
    });
    return {
      id: plot.id,
      points: points
    };
  });

  return meshesData;
}

// 声明变量
let scene, camera, renderer, labelRenderer, controls;
let animationId;
const plotMeshes = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// ================= 优化后的水滴荡漾电流波纹（更稀疏、更圆润）=================
const createWaterRippleEffect = () => {
  const rippleGroup = new THREE.Group();
  const center = new THREE.Vector3(0, -0.2, 0);

  // 配置参数（减少数量，降低扭曲幅度）
  const ringLayers = 2;                // 每圈波纹由2层叠加（之前3层）
  const ringCount = 4;                 // 同时存在4圈波纹（之前6圈）
  const maxRadius = 130;                // 最大半径
  const minRadius = 15;                 // 起始半径
  const branchCount = 20;               // 电流分支数量（之前40）
  const colors = [0x4df0ff, 0x2ad4ff, 0x7ae0ff]; // 简化颜色

  // 存储所有可动画元素
  const rings = [];

  // ----- 生成波纹组（每组由2层叠加，降低扭曲幅度）-----
  for (let i = 0; i < ringCount; i++) {
    const baseRadius = minRadius + (maxRadius - minRadius) * (i / (ringCount - 1));
    const groupColor = colors[i % colors.length];

    for (let layer = 0; layer < ringLayers; layer++) {
      const offsetFactor = (layer - (ringLayers - 1) / 2) * 1.0; // 层间距缩小，保持圆润
      const segments = 120; // 保持平滑

      // 降低扭曲幅度，使形状更接近圆形，但仍保留一点科技不规则感
      const twistFreq = 3 + Math.random() * 4;      // 频率降低
      const twistAmp = 2 + Math.random() * 4;       // 幅度降低（之前5-8）
      const twistPhase = Math.random() * Math.PI * 2;

      const points = [];
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        // 只使用一层正弦扰动，减少复杂叠加
        const rOffset = Math.sin(angle * twistFreq + twistPhase) * twistAmp;

        const radius = Math.max(2, baseRadius + rOffset + offsetFactor);

        // 垂直波动减小
        const yOffset = Math.sin(angle * 8 + twistPhase) * 0.2;

        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        points.push(new THREE.Vector3(x, yOffset, z));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: groupColor,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
      });

      const ring = new THREE.LineLoop(geometry, material);

      ring.userData = {
        type: 'ripple',
        baseRadius: baseRadius,
        speed: 0.5 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        twistFreq,
        twistAmp,
        twistPhase,
        originalOpacity: 0.25,
        layerOffset: offsetFactor,
        groupIndex: i,
      };

      ring.position.copy(center);
      rippleGroup.add(ring);
      rings.push(ring);
    }
  }

  // ----- 生成电流分支（数量减少，长度缩短，更柔和）-----
  const branches = [];
  for (let i = 0; i < branchCount; i++) {
    const angle = (i / branchCount) * Math.PI * 2 + Math.random() * 0.5;
    const length = 30 + Math.random() * 50; // 缩短最大长度
    const color = colors[Math.floor(Math.random() * colors.length)];

    // 每个分支只由单层构成（减少密集感）
    const points = [];
    let x = 0, z = 0;
    const steps = 8 + Math.floor(Math.random() * 5); // 减少拐点

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      // 基础方向
      const dirX = Math.cos(angle);
      const dirZ = Math.sin(angle);
      // 轻微随机偏移，保持分支基本直线
      const offsetAngle = angle + (Math.random() - 0.5) * 0.5 * t; // 偏移减小
      const offsetMag = (Math.random() * 6) * t; // 幅度减小
      const offsetX = Math.cos(offsetAngle) * offsetMag;
      const offsetZ = Math.sin(offsetAngle) * offsetMag;

      x = dirX * length * t + offsetX;
      z = dirZ * length * t + offsetZ;
      const y = Math.sin(t * Math.PI) * 0.8; // 高度降低

      points.push(new THREE.Vector3(x, y, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3 + Math.random() * 0.3,
      blending: THREE.AdditiveBlending
    });

    const branch = new THREE.Line(geometry, material);
    branch.position.copy(center);

    branch.userData = {
      type: 'branch',
      angle,
      length,
      speed: 0.3 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      originalOpacity: material.opacity,
      pulseSpeed: 0.4 + Math.random(),
    };

    rippleGroup.add(branch);
    branches.push(branch);
  }

  // ----- 粒子系统：减少数量，让粒子分布更均匀（避免中心堆积）-----
  const dotCount = 300; // 之前600
  const dotGeometry = new THREE.BufferGeometry();
  const dotPositions = [];
  const dotColors = [];

  for (let i = 0; i < dotCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    // 让粒子在半径20-110之间均匀分布，避免中心点聚集
    const radius = 20 + Math.random() * 90;
    // 使用极坐标生成，确保没有中心堆积
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (Math.random() - 0.5) * 2.0; // 高度范围缩小

    dotPositions.push(x, y, z);

    // 颜色随半径渐变，内圈亮白，外圈偏蓝
    const t = (radius - 20) / 90; // 0~1
    const r = 1.0 - t * 0.3;
    const g = 1.0 - t * 0.2;
    const b = 1.0;
    dotColors.push(r, g, b);
  }

  dotGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
  dotGeometry.setAttribute('color', new THREE.Float32BufferAttribute(dotColors, 3));

  // 创建圆形渐变粒子纹理
  const particleCanvas = document.createElement('canvas');
  particleCanvas.width = 16;
  particleCanvas.height = 16;
  const ctx = particleCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.5, 'rgba(180,220,255,0.8)');
  gradient.addColorStop(1, 'rgba(100,180,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 16, 16);
  const particleMap = new THREE.CanvasTexture(particleCanvas);

  const dotMaterial = new THREE.PointsMaterial({
    size: 0.8,
    map: particleMap,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const dots = new THREE.Points(dotGeometry, dotMaterial);
  dots.userData = { type: 'particles', speed: 0.1 };
  rippleGroup.add(dots);

  return rippleGroup;
};

// 创建信息标签 - 不透明背景
const createInfoLabel = (id, centerX, centerY, centerZ) => {
  const details = plotDetails[id];

  const container = document.createElement('div');
  container.style.background = 'linear-gradient(135deg, #0a1e23 0%, #051418 100%)';
  container.style.border = '2px solid #2a9d8f';
  container.style.borderRadius = '8px';
  container.style.padding = '14px 20px';
  container.style.color = '#e0f2f0';
  container.style.fontFamily = 'Microsoft YaHei, sans-serif';
  container.style.boxShadow = '0 0 30px rgba(42, 157, 143, 0.3)';
  container.style.textAlign = 'left';
  container.style.minWidth = '180px';
  container.style.pointerEvents = 'none';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.opacity = '1';
  container.style.backgroundColor = '#0a1e23';

  // 添加科技感装饰线
  const decorLine = document.createElement('div');
  decorLine.style.position = 'absolute';
  decorLine.style.top = '0';
  decorLine.style.left = '0';
  decorLine.style.width = '100%';
  decorLine.style.height = '2px';
  decorLine.style.background = 'linear-gradient(90deg, transparent, #2a9d8f, #7ae0d0, #2a9d8f, transparent)';
  decorLine.style.animation = 'scanLine 3s linear infinite';
  container.appendChild(decorLine);

  const cropLine = document.createElement('div');
  cropLine.style.fontSize = '18px';
  cropLine.style.fontWeight = 'bold';
  cropLine.style.color = '#7ae0d0';
  cropLine.style.marginBottom = '8px';
  cropLine.style.textShadow = '0 0 10px #2a9d8f';
  cropLine.style.letterSpacing = '1px';
  cropLine.textContent = details.cropType;

  const managerLine = document.createElement('div');
  managerLine.style.fontSize = '15px';
  managerLine.style.marginBottom = '5px';
  managerLine.style.color = '#c0e8e0';
  managerLine.style.display = 'flex';
  managerLine.style.alignItems = 'center';
  managerLine.style.gap = '8px';

  const managerIcon = document.createElement('span');
  managerIcon.style.display = 'inline-block';
  managerIcon.style.width = '4px';
  managerIcon.style.height = '4px';
  managerIcon.style.backgroundColor = '#2a9d8f';
  managerIcon.style.borderRadius = '50%';
  managerIcon.style.boxShadow = '0 0 8px #2a9d8f';

  managerLine.appendChild(managerIcon);
  managerLine.appendChild(document.createTextNode(`负责人：${details.manager}`));

  const ratingLine = document.createElement('div');
  ratingLine.style.fontSize = '15px';
  ratingLine.style.color = '#c0e8e0';
  ratingLine.style.display = 'flex';
  ratingLine.style.alignItems = 'center';
  ratingLine.style.gap = '8px';

  const ratingIcon = document.createElement('span');
  ratingIcon.style.display = 'inline-block';
  ratingIcon.style.width = '4px';
  ratingIcon.style.height = '4px';
  ratingIcon.style.backgroundColor = '#ffd700';
  ratingIcon.style.borderRadius = '50%';
  ratingIcon.style.boxShadow = '0 0 8px #ffd700';

  ratingLine.appendChild(ratingIcon);

  const ratingValue = document.createElement('span');
  ratingValue.style.color = '#ffd700';
  ratingValue.style.fontWeight = 'bold';
  ratingValue.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
  ratingValue.textContent = `${details.rating}%`;

  ratingLine.appendChild(document.createTextNode('好评率：'));
  ratingLine.appendChild(ratingValue);

  container.appendChild(cropLine);
  container.appendChild(managerLine);
  container.appendChild(ratingLine);

  const label = new CSS2DObject(container);
  label.position.set(centerX, centerY + 4.0, centerZ);

  return label;
};


// 创建科技背景元素 - 纯色背景，无网格
const createTechBackground = () => {
  // 创建水波纹效果（放在最底层）
  waterRippleEffect = createWaterRippleEffect();
  scene.add(waterRippleEffect);

  // 创建环形光圈组
  ringGroup = new THREE.Group();

  const ringColors = [0x2a9d8f, 0x40c0b0, 0x60e0d0, 0x7ae0d0];
  const ringRadius = [40, 55, 70, 85, 100];
  const ringPositions = [
    { x: -20, z: -15 },
    { x: 25, z: -20 },
    { x: -15, z: 30 },
    { x: 20, z: 25 },
    { x: -25, z: -30 }
  ];

  ringPositions.forEach((pos, idx) => {
    const radius = ringRadius[idx % ringRadius.length];
    const color = ringColors[idx % ringColors.length];

    // 主环 - 移到地块下方
    const points = [];
    const segments = 80;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius + pos.x;
      const z = Math.sin(angle) * radius + pos.z;
      points.push(new THREE.Vector3(x, -0.5, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending
    });

    const ring = new THREE.LineLoop(geometry, material);
    ringGroup.add(ring);

    // 内圈光点 - 移到地块下方
    const dotCount = 40;
    const dotGeometry = new THREE.BufferGeometry();
    const dotPositions = [];

    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2;
      const x = Math.cos(angle) * (radius - 2) + pos.x;
      const z = Math.sin(angle) * (radius - 2) + pos.z;
      dotPositions.push(x, -0.45, z);
    }

    dotGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    const dotMaterial = new THREE.PointsMaterial({
      color: color,
      size: 0.3,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    const dots = new THREE.Points(dotGeometry, dotMaterial);
    ringGroup.add(dots);
  });

  scene.add(ringGroup);

  // 创建数据流线 - 移到地块下方
  const flowLineCount = 60;
  const flowLineMaterial = new THREE.LineBasicMaterial({
    color: 0x2a9d8f,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending
  });

  dataFlowLines = new THREE.Group();

  for (let i = 0; i < flowLineCount; i++) {
    const startX = (Math.random() - 0.5) * 200;
    const startZ = (Math.random() - 0.5) * 200;
    const endX = startX + (Math.random() - 0.5) * 120;
    const endZ = startZ + (Math.random() - 0.5) * 120;

    const points = [];
    for (let t = 0; t <= 1; t += 0.05) {
      const x = startX * (1 - t) + endX * t;
      const z = startZ * (1 - t) + endZ * t;
      const y = -0.3 + Math.sin(t * Math.PI) * 2;
      points.push(new THREE.Vector3(x, y, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, flowLineMaterial);
    dataFlowLines.add(line);
  }

  scene.add(dataFlowLines);

  // 创建环境粒子 - 移到地块下方
  const particleCount = 1500;
  const particleGeometry = new THREE.BufferGeometry();
  const particlePositions = [];
  const particleColors = [];

  for (let i = 0; i < particleCount; i++) {
    const range = 200;
    const x = (Math.random() - 0.5) * range * 2;
    const z = (Math.random() - 0.5) * range * 2;
    const y = Math.random() * 10 - 5;

    particlePositions.push(x, y, z);

    const colorVal = 0.4 + Math.random() * 0.6;
    particleColors.push(0.2, colorVal, 0.6);
  }

  particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('color', new THREE.Float32BufferAttribute(particleColors, 3));

  const particleTexture = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(42, 157, 143, 1)');
    gradient.addColorStop(0.5, 'rgba(42, 157, 143, 0.5)');
    gradient.addColorStop(1, 'rgba(42, 157, 143, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    return new THREE.CanvasTexture(canvas);
  })();

  ambientParticles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      size: 0.6,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );

  scene.add(ambientParticles);
};

// 创建地块边缘发光效果 - 颜色与信息框边框保持一致
const createEdgeGlow = (localPoints, centerX, centerY, centerZ, color = 0x2a9d8f) => {
  const glowGroup = new THREE.Group();

  // 使用本地坐标创建边缘发光
  // 注意：这些坐标应该是相对于中心点的偏移量
  const linePoints = localPoints.map(p => new THREE.Vector3(p.x, 0.2, p.z));
  linePoints.push(linePoints[0]); // 闭合

  // 调试边缘发光的第一个点
  console.log('边缘发光第一个点:', linePoints[0].x, linePoints[0].z);
  console.log('边缘发光中心点:', centerX, centerY, centerZ);

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });

  const line = new THREE.Line(lineGeometry, lineMaterial);
  glowGroup.add(line);

  // 添加边缘光点
  const dotCount = Math.floor(localPoints.length * 1.5);
  const dotGeometry = new THREE.BufferGeometry();
  const dotPositions = [];

  for (let i = 0; i < dotCount; i++) {
    const idx = Math.floor(Math.random() * localPoints.length);
    const p = localPoints[idx];
    dotPositions.push(p.x, 0.3, p.z);
  }

  dotGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
  const dotMaterial = new THREE.PointsMaterial({
    color: color,
    size: 0.2,
    transparent: true,
    blending: THREE.AdditiveBlending
  });

  const dots = new THREE.Points(dotGeometry, dotMaterial);
  glowGroup.add(dots);

  // 将glowGroup放在中心点
  glowGroup.position.set(centerX, centerY, centerZ);

  return glowGroup;
};

// 重置所有地块到原始状态
const resetAllPlots = () => {
  plotMeshes.forEach(item => {
    const mesh = item.mesh;
    const originalScale = originalScales.get(mesh);
    if (originalScale) {
      mesh.scale.set(originalScale.x, originalScale.y, originalScale.z);
    }

    const glowLight = glowLights.get(mesh);
    if (glowLight) {
      scene.remove(glowLight);
    }

    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => {
          mat.emissive.setHex(0x0a2a2a);
          mat.emissiveIntensity = 0.2;
          mat.color.setHex(item.originalColor);
        });
      } else {
        mesh.material.emissive.setHex(0x0a2a2a);
        mesh.material.emissiveIntensity = 0.2;
        mesh.material.color.setHex(item.originalColor);
      }
    }

    const infoLabel = infoLabels.get(mesh);
    if (infoLabel) {
      scene.remove(infoLabel);
      infoLabels.delete(mesh);
    }

    const edgeGlow = edgeGlowMeshes.get(mesh);
    if (edgeGlow) {
      scene.remove(edgeGlow);
      edgeGlowMeshes.delete(mesh);
    }
  });

  glowLights.clear();
  selectedId.value = null;
  hoveredId.value = null;

  if (controls) {
    controls.autoRotate = true;
  }
};

// 处理点击事件
const onClick = (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const meshes = plotMeshes.map(item => item.mesh);
  const intersects = raycaster.intersectObjects(meshes);

  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    const plotItem = plotMeshes.find(item => item.mesh === clickedMesh);

    if (plotItem) {
      const id = plotItem.mesh.userData.id;

      if (selectedId.value === id) {
        resetAllPlots();
      } else {
        resetAllPlots();

        selectedId.value = id;
        controls.autoRotate = false;

        const originalScale = clickedMesh.scale.clone();
        originalScales.set(clickedMesh, originalScale);
        clickedMesh.scale.set(1.25, 1.25, 1.25);

        const glowLight = new THREE.PointLight(0x2a9d8f, 2.0, 35);
        glowLight.position.set(plotItem.centerX, 3, plotItem.centerZ);
        scene.add(glowLight);
        glowLights.set(clickedMesh, glowLight);

        if (clickedMesh.material) {
          if (Array.isArray(clickedMesh.material)) {
            clickedMesh.material.forEach(mat => {
              mat.emissive.setHex(0x1a4d4d);
              mat.emissiveIntensity = 0.5;
            });
          } else {
            clickedMesh.material.emissive.setHex(0x1a4d4d);
            clickedMesh.material.emissiveIntensity = 0.5;
          }
        }

        const infoLabel = createInfoLabel(id, plotItem.centerX, 1.8, plotItem.centerZ);
        scene.add(infoLabel);
        infoLabels.set(clickedMesh, infoLabel);

        // 使用镜像后的本地坐标创建边缘发光
        const edgeGlow = createEdgeGlowWithMirror(
          plotItem.points,  // 使用原始点
          plotItem.centerX,
          1.5,
          plotItem.centerZ,
          0x7ae0d0
        );
        scene.add(edgeGlow);
        edgeGlowMeshes.set(clickedMesh, edgeGlow);
      }
    }
  } else {
    resetAllPlots();
  }
};
// 处理鼠标移动（用于悬停效果）
const onMouseMove = (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const meshes = plotMeshes.map(item => item.mesh);
  const intersects = raycaster.intersectObjects(meshes);

  plotMeshes.forEach(item => {
    const mesh = item.mesh;
    if (selectedId.value !== mesh.userData.id) {
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => {
            mat.emissive.setHex(0x0a2a2a);
            mat.emissiveIntensity = 0.2;
            mat.color.setHex(item.originalColor);
          });
        } else {
          mesh.material.emissive.setHex(0x0a2a2a);
          mesh.material.emissiveIntensity = 0.2;
          mesh.material.color.setHex(item.originalColor);
        }
      }
    }
  });

  if (intersects.length > 0) {
    const hoveredMesh = intersects[0].object;
    const plotItem = plotMeshes.find(item => item.mesh === hoveredMesh);

    if (plotItem) {
      const id = plotItem.mesh.userData.id;
      hoveredId.value = id;

      if (selectedId.value !== id) {
        if (hoveredMesh.material) {
          if (Array.isArray(hoveredMesh.material)) {
            hoveredMesh.material.forEach(mat => {
              mat.color.setHex(0x2a9d8f);
              mat.emissive.setHex(0x1a4d4d);
              mat.emissiveIntensity = 0.4;
            });
          } else {
            hoveredMesh.material.color.setHex(0x2a9d8f);
            hoveredMesh.material.emissive.setHex(0x1a4d4d);
            hoveredMesh.material.emissiveIntensity = 0.4;
          }
        }

        const existingLight = glowLights.get(hoveredMesh);
        if (!existingLight) {
          const hoverLight = new THREE.PointLight(0x2a9d8f, 1.0, 25);
          hoverLight.position.set(plotItem.centerX, 2.5, plotItem.centerZ);
          scene.add(hoverLight);
          glowLights.set(hoveredMesh, hoverLight);
        }

        const existingLabel = infoLabels.get(hoveredMesh);
        if (!existingLabel) {
          const infoLabel = createInfoLabel(id, plotItem.centerX, 1.8, plotItem.centerZ);
          scene.add(infoLabel);
          infoLabels.set(hoveredMesh, infoLabel);
        }

        const existingEdgeGlow = edgeGlowMeshes.get(hoveredMesh);
        if (!existingEdgeGlow) {
          // 使用镜像后的本地坐标创建边缘发光
          const edgeGlow = createEdgeGlowWithMirror(
            plotItem.points,  // 使用原始点
            plotItem.centerX,
            1.5,
            plotItem.centerZ,
            0x7ae0d0
          );
          scene.add(edgeGlow);
          edgeGlowMeshes.set(hoveredMesh, edgeGlow);
        }
      }
    }
  } else {
    hoveredId.value = null;

    plotMeshes.forEach(item => {
      const mesh = item.mesh;
      if (selectedId.value !== mesh.userData.id) {
        const light = glowLights.get(mesh);
        if (light) {
          scene.remove(light);
          glowLights.delete(mesh);
        }

        const label = infoLabels.get(mesh);
        if (label) {
          scene.remove(label);
          infoLabels.delete(mesh);
        }

        const edgeGlow = edgeGlowMeshes.get(mesh);
        if (edgeGlow) {
          scene.remove(edgeGlow);
          edgeGlowMeshes.delete(mesh);
        }
      }
    });
  }
};

// 初始化场景 - 纯色背景
const initScene = () => {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x061014); // 纯色背景，无网格

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 1.2;
  document.querySelector('.three-container').appendChild(renderer.domElement);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.left = '0px';
  labelRenderer.domElement.style.pointerEvents = 'none';
  document.querySelector('.three-container').appendChild(labelRenderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  // controls.maxPolarAngle = Math.PI / 2.3;
  controls.maxPolarAngle = Math.PI; // 允许从底部到顶部的完全旋转
  controls.minDistance = 50;
  controls.maxDistance = 300;

  const ambientLight = new THREE.AmbientLight(0x202a30);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xc0e8e0, 1.2);
  dirLight.position.set(30, 80, 40);
  dirLight.castShadow = true;
  dirLight.receiveShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  const d = 200;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 400;
  scene.add(dirLight);

  const backLight = new THREE.PointLight(0x2a9d8f, 0.6);
  backLight.position.set(-40, 30, -60);
  scene.add(backLight);

  const topLight = new THREE.PointLight(0x40c0b0, 0.4);
  topLight.position.set(20, 100, 20);
  scene.add(topLight);

  createTechBackground();

  renderer.domElement.addEventListener('click', onClick);
  renderer.domElement.addEventListener('mousemove', onMouseMove);
};

// 创建单个地块 - 增强立体感和渐变
const createPlotMesh = (plotId, points, color) => {
  console.warn('createPlotMesh 已废弃，直接在 generatePlots 中创建');
  return null;
};

// 调整相机位置
const adjustCameraToFitPlots = (meshesData) => {
  const allPoints = [];
  meshesData.forEach(item => {
    item.points.forEach(p => {
      allPoints.push(new THREE.Vector3(p.x, 0, p.z));
    });
  });

  if (allPoints.length === 0) return;

  const box = new THREE.Box3().setFromPoints(allPoints);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);

  const maxSize = Math.max(size.x, size.z);
  const distance = maxSize / (1.4 * Math.tan((camera.fov * Math.PI) / 360));

  camera.position.set(center.x + distance * 0.3, distance * 0.3, center.z + distance * 0.5);
  camera.lookAt(center.x, center.y + 1.5, center.z);

  controls.target.set(center.x, center.y + 1.5, center.z);
};

// 生成地形起伏的顶点位移函数（基于噪声）
function applyTerrainUndulation(geometry, depth = 2.0) {
  const positionAttribute = geometry.getAttribute('position');
  const vertex = new THREE.Vector3();

  // 遍历所有顶点
  for (let i = 0; i < positionAttribute.count; i++) {
    vertex.fromBufferAttribute(positionAttribute, i);

    // 判断是否为顶部面（y 接近 depth/2，考虑bevel影响）
    if (vertex.y > depth * 0.3) { // 粗略筛选顶部区域
      // 基于 x, z 计算噪声值（使用正弦函数模拟自然起伏）
      const noise = Math.sin(vertex.x * 0.3) * Math.cos(vertex.z * 0.25) * 0.8 +
        Math.sin(vertex.x * 0.8) * 0.5;
      // 将噪声映射到高度变化范围 0 ~ 1.2
      const heightOffset = (noise * 0.5 + 0.5) * 1.2;
      vertex.y += heightOffset;

      // 更新顶点位置
      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
  }

  positionAttribute.needsUpdate = true;
  geometry.computeVertexNormals(); // 更新法线以正确光照
}

// 生成三个地块
const generatePlots = () => {
  const meshesData = transformWithNonOverlap();

  // === 新增：计算整体范围并创建大底座 ===
  const allPoints = meshesData.flatMap(item => item.points);
  const xs = allPoints.map(p => p.x);
  const zs = allPoints.map(p => p.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const baseCenterX = (minX + maxX) / 2;
  const baseCenterZ = (minZ + maxZ) / 2;
  const width = maxX - minX;
  const depth = maxZ - minZ;
  const baseRadius = Math.max(width, depth) * 0.9; // 底座半径略大于地块范围

  const basePlate = createBasePlate(baseCenterX, baseCenterZ, baseRadius);
  scene.add(basePlate);
  // === 新增结束 ===

  const colors = [0x3a8c8c, 0x6a4e9c, 0x4a7a9c]; // 更科技感的颜色

  meshesData.forEach((item, index) => {
    const color = colors[index % colors.length];

    // 计算中心点
    const centerX = item.points.reduce((sum, p) => sum + p.x, 0) / item.points.length;
    const centerZ = item.points.reduce((sum, p) => sum + p.z, 0) / item.points.length;

    // 本地坐标
    const localPoints = item.points.map(p => ({
      x: p.x - centerX,
      z: p.z - centerZ
    }));

    // 创建形状
    const shape = new THREE.Shape();
    shape.moveTo(localPoints[0].x, localPoints[0].z);
    for (let i = 1; i < localPoints.length; i++) {
      shape.lineTo(localPoints[i].x, localPoints[i].z);
    }
    shape.closePath();

    // 挤出设置
    const depth = 2.5;
    const extrudeSettings = {
      steps: 1,
      depth: depth,
      bevelEnabled: true,
      bevelThickness: 0.4,
      bevelSize: 0.3,
      bevelSegments: 5
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(-Math.PI / 2);

    // 应用地形起伏（可选）
    applyTerrainUndulation(geometry, depth);

    // 材质升级：增加自发光强度
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.2,
      metalness: 0.5,
      emissive: new THREE.Color(0x2a5a7a),
      emissiveIntensity: 0.6,
      flatShading: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.id = item.id;
    mesh.position.set(centerX, 0, centerZ);
    scene.add(mesh);

    // 为每个地块添加永久科技感元素
    // 1. 底部光晕平面
    const glowPlane = createGlowPlane(localPoints, centerX, centerZ);
    scene.add(glowPlane);

    // 2. 常驻边缘发光（含流动粒子）
    const permanentEdgeGlow = createPermanentEdgeGlow(localPoints, centerX, centerZ, color);
    scene.add(permanentEdgeGlow);

    // 3. 表面流动粒子
    const surfaceParticles = createSurfaceParticles(localPoints, centerX, centerZ);
    scene.add(surfaceParticles);

    // 保存地块信息（用于交互）
    plotMeshes.push({
      mesh,
      centerX,
      centerZ,
      points: item.points,
      localPoints: localPoints,
      id: item.id,
      originalColor: color,
      permanentGlow: permanentEdgeGlow,
      glowPlane: glowPlane,
      surfaceParticles: surfaceParticles
    });

    // ID 标签（保持不变）
    const idDiv = document.createElement('div');
    idDiv.textContent = item.id;
    idDiv.style.color = '#7ae0d0';
    idDiv.style.fontSize = '22px';
    idDiv.style.fontWeight = '600';
    idDiv.style.textShadow = '0 0 15px #2a9d8f';
    idDiv.style.backgroundColor = '#0a1e23';
    idDiv.style.padding = '2px 12px';
    idDiv.style.borderRadius = '20px';
    idDiv.style.border = '2px solid #2a9d8f';
    idDiv.style.fontFamily = 'Arial, sans-serif';
    idDiv.style.boxShadow = '0 0 20px rgba(42, 157, 143, 0.3)';
    const idLabel = new CSS2DObject(idDiv);
    idLabel.position.set(centerX, 1.2, centerZ);
    scene.add(idLabel);
  });

  adjustCameraToFitPlots(meshesData);
};

// 创建底部光晕平面
const createGlowPlane = (localPoints, centerX, centerZ) => {
  // 计算包围盒大小
  const xs = localPoints.map(p => p.x);
  const zs = localPoints.map(p => p.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const width = maxX - minX;
  const depth = maxZ - minZ;
  const radius = Math.max(width, depth) * 0.8;

  const geometry = new THREE.CircleGeometry(radius, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0x2a9d8f,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(centerX, -0.3, centerZ);
  return plane;
};

// 创建常驻边缘发光（带流动粒子）
const createPermanentEdgeGlow = (localPoints, centerX, centerZ, baseColor) => {
  const group = new THREE.Group();

  // 闭合点
  const closedPoints = [...localPoints, localPoints[0]];
  const linePoints = closedPoints.map(p => new THREE.Vector3(p.x, 0.2, p.z));

  // 发光线条（透明度较低）
  const lineMat = new THREE.LineBasicMaterial({
    color: baseColor,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
  });
  const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
  const line = new THREE.Line(lineGeo, lineMat);
  group.add(line);

  // 流动粒子（简化版，不依赖外部数据，直接在动画中更新）
  const particleCount = 40;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  // 计算每段长度
  let totalLength = 0;
  const segLengths = [];
  for (let i = 0; i < closedPoints.length - 1; i++) {
    const p1 = closedPoints[i];
    const p2 = closedPoints[i + 1];
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    segLengths.push(len);
    totalLength += len;
  }

  // 存储粒子数据到 group.userData，供动画使用
  const particleData = [];
  for (let i = 0; i < particleCount; i++) {
    const progress = i / particleCount;
    particleData.push({
      progress: progress,
      speed: 0.2 + Math.random() * 0.2
    });

    // 初始位置
    let remaining = progress * totalLength;
    let segIndex = 0;
    while (remaining > segLengths[segIndex] && segIndex < segLengths.length - 1) {
      remaining -= segLengths[segIndex];
      segIndex++;
    }
    const t = remaining / segLengths[segIndex];
    const p1 = closedPoints[segIndex];
    const p2 = closedPoints[segIndex + 1];
    const x = p1.x + (p2.x - p1.x) * t;
    const z = p1.z + (p2.z - p1.z) * t;

    positions[i * 3] = x;
    positions[i * 3 + 1] = 0.3;
    positions[i * 3 + 2] = z;

    // 颜色蓝白
    colors[i * 3] = 0.8;
    colors[i * 3 + 1] = 0.9;
    colors[i * 3 + 2] = 1.0;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMat = new THREE.PointsMaterial({
    size: 0.3,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  particles.userData = {
    type: 'permanentEdgeParticles',
    closedPoints,
    segLengths,
    totalLength,
    particleData
  };
  group.add(particles);

  group.position.set(centerX, 0, centerZ);
  return group;
};

// 创建表面流动粒子
const createSurfaceParticles = (localPoints, centerX, centerZ) => {
  const count = 30;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // 随机在地块多边形内部生成点（简化：在包围盒内随机，然后用点在多边形内检测，此处略，直接用随机）
  const xs = localPoints.map(p => p.x);
  const zs = localPoints.map(p => p.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  for (let i = 0; i < count; i++) {
    const x = minX + Math.random() * (maxX - minX);
    const z = minZ + Math.random() * (maxZ - minZ);
    // 简单的点在多边形内检测省略，直接使用，可能有些点在外部，但视觉影响不大
    positions[i * 3] = x;
    positions[i * 3 + 1] = 0.5 + Math.random() * 0.5; // 高度在表面上方
    positions[i * 3 + 2] = z;

    colors[i * 3] = 0.2 + Math.random() * 0.8;
    colors[i * 3 + 1] = 0.5 + Math.random() * 0.5;
    colors[i * 3 + 2] = 1.0;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.25,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geo, mat);
  particles.position.set(centerX, 0, centerZ);
  particles.userData = { type: 'surfaceParticles', speed: 0.1 };
  return particles;
};

// 创建科技大底座（放在 createSurfaceParticles 之后）
const createBasePlate = (centerX, centerZ, radius) => {
  const group = new THREE.Group();

  // 1. 主基板：半透明圆形平面，带自发光
  const mainPlateGeo = new THREE.CircleGeometry(radius, 64);
  const mainPlateMat = new THREE.MeshStandardMaterial({
    color: 0x1a4d6e,
    emissive: 0x0a2a3a,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
    roughness: 0.3,
    metalness: 0.7
  });
  const mainPlate = new THREE.Mesh(mainPlateGeo, mainPlateMat);
  mainPlate.rotation.x = -Math.PI / 2;
  mainPlate.position.set(centerX, -0.8, centerZ);
  group.add(mainPlate);

  // 2. 底座边缘发光环（多层）
  const edgeRingMat = new THREE.LineBasicMaterial({
    color: 0x2ad4ff,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });

  // 外环
  const outerRingPoints = [];
  const segments = 80;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * (radius + 1);
    const z = Math.sin(angle) * (radius + 1);
    outerRingPoints.push(new THREE.Vector3(x, -0.7, z));
  }
  const outerRingGeo = new THREE.BufferGeometry().setFromPoints(outerRingPoints);
  const outerRing = new THREE.LineLoop(outerRingGeo, edgeRingMat);
  outerRing.position.set(centerX, 0, centerZ);
  group.add(outerRing);

  // 内环（稍小，反向旋转增加动态感）
  const innerRingPoints = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * (radius - 1);
    const z = Math.sin(angle) * (radius - 1);
    innerRingPoints.push(new THREE.Vector3(x, -0.65, z));
  }
  const innerRingGeo = new THREE.BufferGeometry().setFromPoints(innerRingPoints);
  const innerRing = new THREE.LineLoop(innerRingGeo, edgeRingMat);
  innerRing.position.set(centerX, 0, centerZ);
  group.add(innerRing);

  // 3. 底座表面流动光点
  const dotCount = 80;
  const dotPositions = [];
  const dotColors = [];
  for (let i = 0; i < dotCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = radius * (0.3 + Math.random() * 0.7);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    dotPositions.push(x, -0.75, z);

    const colorVal = 0.6 + Math.random() * 0.4;
    dotColors.push(0.2, colorVal, 1.0);
  }
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
  dotGeo.setAttribute('color', new THREE.Float32BufferAttribute(dotColors, 3));

  const dotMat = new THREE.PointsMaterial({
    size: 0.3,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending
  });
  const dots = new THREE.Points(dotGeo, dotMat);
  dots.position.set(centerX, 0, centerZ);
  group.add(dots);

  // 4. 海浪滴胶效果：添加几个半透明的波浪环
  const waveCount = 3;
  const waveColors = [0x4df0ff, 0x7a4df0, 0x4df0aa];
  for (let w = 0; w < waveCount; w++) {
    const waveRadius = radius * (0.6 + w * 0.2);
    const wavePoints = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const rOffset = Math.sin(angle * 8 + w * 2) * 2;
      const r = waveRadius + rOffset;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = -0.6 + Math.sin(angle * 6 + w) * 0.1;
      wavePoints.push(new THREE.Vector3(x, y, z));
    }
    const waveGeo = new THREE.BufferGeometry().setFromPoints(wavePoints);
    const waveMat = new THREE.LineBasicMaterial({
      color: waveColors[w % waveColors.length],
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending
    });
    const waveLine = new THREE.LineLoop(waveGeo, waveMat);
    waveLine.position.set(centerX, 0, centerZ);
    group.add(waveLine);
  }

  // 保存到全局变量以便动画使用
  basePlateGroup = group;
  return group;
};


// 创建炫酷边缘发光（多层线条 + 流动粒子）
const createEdgeGlowWithMirror = (worldPoints, centerX, centerY, centerZ, color = 0x2a9d8f) => {
  const glowGroup = new THREE.Group();

  // 将世界坐标转换为本地坐标，并应用Z轴镜像
  const localPoints = worldPoints.map(p => ({
    x: p.x - centerX,
    z: -(p.z - centerZ)  // Z轴镜像
  }));

  // 闭合点数组
  const closedPoints = [...localPoints, localPoints[0]];
  const linePoints = closedPoints.map(p => new THREE.Vector3(p.x, 0.2, p.z));

  // ----- 多层发光线条（模拟光晕）-----
  const lineMaterialMain = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });

  const lineMaterialOuter = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending
  });

  const lineMaterialInner = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
  });

  // 主线条
  const mainLineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
  const mainLine = new THREE.Line(mainLineGeo, lineMaterialMain);
  glowGroup.add(mainLine);

  // 外发光线条（略微抬高）
  const outerPoints = linePoints.map(p => p.clone().add(new THREE.Vector3(0, 0.1, 0)));
  const outerLineGeo = new THREE.BufferGeometry().setFromPoints(outerPoints);
  const outerLine = new THREE.Line(outerLineGeo, lineMaterialOuter);
  glowGroup.add(outerLine);

  // 内发光线条（略微降低）
  const innerPoints = linePoints.map(p => p.clone().add(new THREE.Vector3(0, -0.1, 0)));
  const innerLineGeo = new THREE.BufferGeometry().setFromPoints(innerPoints);
  const innerLine = new THREE.Line(innerLineGeo, lineMaterialInner);
  glowGroup.add(innerLine);

  // ----- 流光粒子（沿边缘移动）-----
  const particleCount = 60;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);
  const particleData = [];

  let totalLength = 0;
  const segLengths = [];
  for (let i = 0; i < closedPoints.length - 1; i++) {
    const p1 = closedPoints[i];
    const p2 = closedPoints[i + 1];
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const len = Math.sqrt(dx * dx + dz * dz);
    segLengths.push(len);
    totalLength += len;
  }

  for (let i = 0; i < particleCount; i++) {
    const progress = i / particleCount;
    particleData.push({
      progress: progress,
      speed: 0.2 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2
    });

    let remaining = progress * totalLength;
    let segIndex = 0;
    while (remaining > segLengths[segIndex] && segIndex < segLengths.length - 1) {
      remaining -= segLengths[segIndex];
      segIndex++;
    }
    const t = remaining / segLengths[segIndex];
    const p1 = closedPoints[segIndex];
    const p2 = closedPoints[segIndex + 1];
    const x = p1.x + (p2.x - p1.x) * t;
    const z = p1.z + (p2.z - p1.z) * t;

    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = 0.3;
    particlePositions[i * 3 + 2] = z;

    const r = 0.6 + Math.random() * 0.4;
    const g = 0.8 + Math.random() * 0.2;
    const b = 1.0;
    particleColors[i * 3] = r;
    particleColors[i * 3 + 1] = g;
    particleColors[i * 3 + 2] = b;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.5, 'rgba(180,220,255,0.8)');
  gradient.addColorStop(1, 'rgba(100,180,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 16, 16);
  const particleMap = new THREE.CanvasTexture(canvas);

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.4,
    map: particleMap,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particles = new THREE.Points(particleGeo, particleMaterial);
  particles.userData = {
    type: 'edgeParticles',
    closedPoints: closedPoints,
    segLengths: segLengths,
    totalLength: totalLength,
    particleData: particleData,
    speedFactor: 0.5
  };

  glowGroup.add(particles);
  glowGroup.position.set(centerX, centerY, centerZ);

  return glowGroup;
};

const animate = () => {
  animationId = requestAnimationFrame(animate);

  // ----- 增强型电流波纹动画（水滴荡漾效果）-----
  if (waterRippleEffect) {
    const time = Date.now() * 0.001;

    // 全局扩散脉冲：模拟水滴荡漾，产生向外扩散并消散的效果
    const pulse1 = Math.sin(time * 0.5) * 0.5 + 0.5;          // 慢速脉冲
    const pulse2 = Math.sin(time * 1.2) * 0.3 + 0.3;          // 中速脉冲
    const pulse3 = Math.sin(time * 2.5) * 0.2 + 0.2;          // 快速脉冲
    const globalPulse = pulse1 * 0.6 + pulse2 * 0.3 + pulse3 * 0.1;

    // 当前扩散半径偏移量：从最小到最大，然后回缩，模拟水滴扩散消散
    // 范围为 -15 到 35，使得波纹可以超出基础半径然后消散
    const globalOffset = (globalPulse * 50) - 15; // 范围约 -15 ~ 35

    waterRippleEffect.children.forEach((child) => {
      // 处理波纹环
      if (child.isLineLoop && child.userData && child.userData.type === 'ripple') {
        const ud = child.userData;

        // 计算当前半径：基础半径 + 全局偏移 + 层偏移 + 动态扭曲
        const currentRadius = Math.max(2, ud.baseRadius + globalOffset + ud.layerOffset);

        // 重新生成几何体，实现半径变化和扭曲流动
        const segments = 140;
        const points = [];
        for (let j = 0; j <= segments; j++) {
          const angle = (j / segments) * Math.PI * 2;
          // 动态扭曲：随时间变化，产生电流流动感
          const twist = Math.sin(angle * ud.twistFreq + time * 1.8 + ud.twistPhase) * ud.twistAmp;
          // 增加额外高频扰动
          const noise = Math.sin(angle * 20 + time * 4) * 1.5;
          const radius = Math.max(1, currentRadius + twist + noise);

          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          // 垂直波动也随时间变化
          const y = Math.sin(angle * 12 + time * 2.5) * 0.5;

          points.push(new THREE.Vector3(x, y, z));
        }

        child.geometry.dispose();
        child.geometry = new THREE.BufferGeometry().setFromPoints(points);

        // 透明度随半径增大而减小（内亮外暗），同时随脉冲变化
        const minRadius = 15; // 应与 createWaterRippleEffect 中的 minRadius 一致
        const maxRadius = 130; // 应与 createWaterRippleEffect 中的 maxRadius 一致
        const radiusFactor = Math.max(0, 1 - (currentRadius - minRadius) / (maxRadius - minRadius));
        // 脉冲因子
        const pulseFactor = 0.5 + 0.5 * Math.sin(time * 1.5 + ud.phase);

        child.material.opacity = ud.originalOpacity * radiusFactor * (0.8 + 0.2 * pulseFactor);
      }

      // 处理电流分支
      if (child.isLine && child.userData && child.userData.type === 'branch') {
        const ud = child.userData;

        // 分支的亮度随时间闪烁，并随扩散半径变化（越远越暗）
        const blink = Math.sin(time * ud.pulseSpeed + ud.phase) * 0.5 + 0.5;

        // 根据扩散偏移量计算距离因子（近似）
        const distFactor = Math.max(0, 1 - (globalOffset + 15) / 60); // 随扩散而变暗

        child.material.opacity = ud.originalOpacity * (0.3 + blink * 0.5) * distFactor;
      }

      // 处理粒子系统
      if (child.isPoints && child.userData && child.userData.type === 'particles') {
        // 粒子缓慢旋转
        child.rotation.y += 0.0008;
      }
    });
  }
  // 更新边缘发光粒子的流动
  edgeGlowMeshes.forEach((glowGroup) => {
    glowGroup.children.forEach(child => {
      if (child.isPoints && child.userData && child.userData.type === 'edgeParticles') {
        const ud = child.userData;
        const positions = child.geometry.attributes.position.array;
        const count = positions.length / 3;
        const time = Date.now() * 0.001;

        for (let i = 0; i < count; i++) {
          // 更新每个粒子的进度
          const pData = ud.particleData[i];
          // 进度增加，速度随时间微调
          pData.progress += 0.005 * pData.speed; // 调整速度
          if (pData.progress > 1) pData.progress -= 1;

          // 根据进度计算新位置
          let remaining = pData.progress * ud.totalLength;
          let segIndex = 0;
          while (remaining > ud.segLengths[segIndex] && segIndex < ud.segLengths.length - 1) {
            remaining -= ud.segLengths[segIndex];
            segIndex++;
          }
          const t = remaining / ud.segLengths[segIndex];
          const p1 = ud.closedPoints[segIndex];
          const p2 = ud.closedPoints[segIndex + 1];
          const x = p1.x + (p2.x - p1.x) * t;
          const z = p1.z + (p2.z - p1.z) * t;

          positions[i * 3] = x;
          positions[i * 3 + 1] = 0.3 + Math.sin(time * 3 + pData.phase) * 0.1; // 轻微上下浮动
          positions[i * 3 + 2] = z;
        }

        child.geometry.attributes.position.needsUpdate = true;

        // 可选：让粒子大小也波动
        // child.material.size = 0.4 + Math.sin(time * 5) * 0.1;
      }
    });
  });

  // ----- 其他背景元素动画 -----
  if (ringGroup) {
    ringGroup.rotation.y += 0.0003;
  }

  if (dataFlowLines) {
    dataFlowLines.rotation.y += 0.0002;
  }

  if (ambientParticles) {
    const positions = ambientParticles.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
      positions[i] += 0.01;
      if (positions[i] > 10) positions[i] = -5;
    }
    ambientParticles.geometry.attributes.position.needsUpdate = true;
  }



  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);

  // 在 animate 函数内，现有代码后添加：

  // 更新永久边缘粒子的位置（流动）
  plotMeshes.forEach(item => {
    if (item.permanentGlow) {
      item.permanentGlow.children.forEach(child => {
        if (child.isPoints && child.userData.type === 'permanentEdgeParticles') {
          const ud = child.userData;
          const positions = child.geometry.attributes.position.array;
          const count = positions.length / 3;
          const time = Date.now() * 0.001;

          for (let i = 0; i < count; i++) {
            const pData = ud.particleData[i];
            pData.progress += 0.002 * pData.speed;
            if (pData.progress > 1) pData.progress -= 1;

            let remaining = pData.progress * ud.totalLength;
            let segIndex = 0;
            while (remaining > ud.segLengths[segIndex] && segIndex < ud.segLengths.length - 1) {
              remaining -= ud.segLengths[segIndex];
              segIndex++;
            }
            const t = remaining / ud.segLengths[segIndex];
            const p1 = ud.closedPoints[segIndex];
            const p2 = ud.closedPoints[segIndex + 1];
            const x = p1.x + (p2.x - p1.x) * t;
            const z = p1.z + (p2.z - p1.z) * t;

            positions[i * 3] = x;
            positions[i * 3 + 1] = 0.3 + Math.sin(time * 4 + i) * 0.1;
            positions[i * 3 + 2] = z;
          }
          child.geometry.attributes.position.needsUpdate = true;
        }
      });
    }

    // 表面粒子缓慢移动（简单旋转）
    if (item.surfaceParticles) {
      item.surfaceParticles.rotation.y += 0.001;
    }

    // 底部光晕透明度脉动
    if (item.glowPlane) {
      const time = Date.now() * 0.001;
      item.glowPlane.material.opacity = 0.15 + Math.sin(time * 2) * 0.05;
    }
  });


};

const handleResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
};

onMounted(() => {
  initScene();
  generatePlots();

  window.addEventListener('resize', handleResize);
  animate();
});

onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  window.removeEventListener('resize', handleResize);

  if (renderer) {
    renderer.domElement.removeEventListener('click', onClick);
    renderer.domElement.removeEventListener('mousemove', onMouseMove);
    renderer.dispose();
  }
  if (labelRenderer) {
    labelRenderer.domElement.remove();
  }
});
</script>

<style>
@keyframes scanLine {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

.three-container {
  width: 100vw;
  height: 100vh;
  display: block;
  background-color: #061014;
  position: relative;
  overflow: hidden;
}
</style>