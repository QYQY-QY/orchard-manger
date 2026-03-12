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
      const distSq = dx*dx + dz*dz;
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
      points.push(new THREE.Vector3(x, -0.5, z)); // 放到地块下方
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
      dotPositions.push(x, -0.45, z); // 放到地块下方
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
      const x = startX * (1-t) + endX * t;
      const z = startZ * (1-t) + endZ * t;
      const y = -0.3 + Math.sin(t * Math.PI) * 2; // 放到地块下方
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
    const y = Math.random() * 10 - 5; // 分布在下方
    
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
  
  // 添加底部光晕 - 不透明
  const glowPlaneGeometry = new THREE.CircleGeometry(300, 64);
  const glowPlaneMaterial = new THREE.MeshBasicMaterial({
    color: 0x1a4d4d,
    transparent: false,
    opacity: 0.1,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  
  const glowPlane = new THREE.Mesh(glowPlaneGeometry, glowPlaneMaterial);
  glowPlane.rotation.x = -Math.PI / 2;
  glowPlane.position.y = -0.5;
  scene.add(glowPlane);
};

// 创建地块边缘发光效果 - 颜色与信息框边框保持一致
const createEdgeGlow = (points, centerX, centerY, centerZ, color = 0x2a9d8f) => {
  const glowGroup = new THREE.Group();
  
  // 创建边缘发光线条
  const linePoints = points.map(p => new THREE.Vector3(p.x, 0.2, p.z));
  linePoints.push(linePoints[0]); // 闭合
  
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
  const dotCount = Math.floor(points.length * 1.5);
  const dotGeometry = new THREE.BufferGeometry();
  const dotPositions = [];
  
  for (let i = 0; i < dotCount; i++) {
    const idx = Math.floor(Math.random() * points.length);
    const p = points[idx];
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
        
        const edgeGlow = createEdgeGlow(plotItem.points, plotItem.centerX, 1.5, plotItem.centerZ, 0x7ae0d0);
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
          // 使用与信息框边框相同的颜色 0x2a9d8f
          const edgeGlow = createEdgeGlow(plotItem.points, plotItem.centerX, 1.5, plotItem.centerZ, 0x2a9d8f);
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
  controls.maxPolarAngle = Math.PI / 2.3;
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
  const shape = new THREE.Shape();
  if (points.length === 0) return null;
  
  shape.moveTo(points[0].x, points[0].z);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i].x, points[i].z);
  }
  shape.closePath();

  const extrudeSettings = {
    steps: 1,
    depth: 2.0,
    bevelEnabled: true,
    bevelThickness: 0.3,
    bevelSize: 0.25,
    bevelSegments: 4
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.2,
    metalness: 0.3,
    emissive: 0x0a2a2a,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.95,
    flatShading: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.id = plotId;

  const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const centerZ = points.reduce((sum, p) => sum + p.z, 0) / points.length;

  // 添加顶部高光面 - 不透明
  const topFaceMaterial = new THREE.MeshBasicMaterial({
    color: 0x2a9d8f,
    transparent: false,
    opacity: 0.15,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  
  for (let i = 0; i < points.length - 2; i++) {
    const triangleGeometry = new THREE.BufferGeometry();
    const triangleVertices = [
      points[0].x, 1.0, points[0].z,
      points[i + 1].x, 1.0, points[i + 1].z,
      points[i + 2].x, 1.0, points[i + 2].z
    ];
    triangleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(triangleVertices, 3));
    triangleGeometry.setIndex([0, 1, 2]);
    triangleGeometry.computeVertexNormals();
    
    const triangleMesh = new THREE.Mesh(triangleGeometry, topFaceMaterial);
    mesh.add(triangleMesh);
  }

  return { mesh, centerX, centerZ, color, points };
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

// 生成三个地块
const generatePlots = () => {
  const meshesData = transformWithNonOverlap();

  const colors = [0x1a6b5e, 0x1f7a6b, 0x248b78];

  meshesData.forEach((item, index) => {
    const color = colors[index % colors.length];
    const result = createPlotMesh(item.id, item.points, color);
    if (result) {
      const { mesh, centerX, centerZ, color, points } = result;
      
      scene.add(mesh);
      
      plotMeshes.push({ 
        mesh, 
        centerX, 
        centerZ,
        points,
        id: item.id,
        originalColor: color
      });

      // 创建ID小标签 - 不透明背景
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
      idDiv.style.opacity = '1';

      const idLabel = new CSS2DObject(idDiv);
      idLabel.position.set(centerX, 1.2, centerZ);
      scene.add(idLabel);
    }
  });

  adjustCameraToFitPlots(meshesData);
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  
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
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
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