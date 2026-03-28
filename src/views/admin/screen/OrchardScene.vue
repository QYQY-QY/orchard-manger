<!-- OrchardScene.vue - 果园 3D 地图大屏 -->
<template>
  <div ref="mapContainer" class="map-container"></div>
  <div id="loading" class="loading" :style="{ display: loadingVisible ? 'flex' : 'none' }">
    <span>🗺️ 果园数据加载中...</span>
  </div>
  <div id="progress-bar" class="progress-bar" :style="{ display: showProgressBar ? 'block' : 'none' }">
    <div id="progress-fill" class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const emit = defineEmits(['region-click']);
const router = useRouter();
const route = useRoute();

const isStandalone = computed(() => {
  return route.path === '/OrchardScene' || route.path.includes('/OrchardScene');
});

const mapContainer = ref(null);
const loadingVisible = ref(true);
const showProgressBar = ref(true);
const progressWidth = ref(0);

let scene, camera, renderer, labelRenderer, controls, stars, jinhuaGroup;
let animationFrameId = null;
let raycaster, mouse;

const regionMeshes = {
  1: { meshes: [], edges: [] },
  2: { meshes: [], edges: [] },
  3: { meshes: [], edges: [] }
};

const regionLabels = {
  1: { name: null, info: null },
  2: { name: null, info: null },
  3: { name: null, info: null }
};

let currentHighlightedRegion = null;
const meshOriginalColors = new Map();

const NEW_BOUNDS = {
  minLng: 119.5,
  maxLng: 120.0,
  minLat: 28.7,
  maxLat: 29.3
};

const MAP_SIZE = 28;
const EDGE_COLOR = 0x3f503b;
const HIGHLIGHT_COLOR = 0x6bb392;

const REGION_COLORS = {
  1: 0x2a6e3f,
  2: 0x33cc66,
  3: 0x779649
};

const REGION_NAMES = {
  1: '汤村',
  2: '莲村',
  3: '桂村'
};

const REGION_MANAGERS = {
  1: '张齐',
  2: '李昀',
  3: '王钿'
};

const REGION_STATS = {
  1: { goodRate: 85 },
  2: { goodRate: 92 },
  3: { goodRate: 78 }
};

const REGION_LABEL_OFFSETS = {
  1: { x: -6.4, z: 3.4 },
  2: { x: 2.0, z: -5.44 },
  3: { x: -1.0, z: 2.0 }
};

const mainCitrusCounties = [
  { name: '婺城区', adcode: 330702, lng: 119.65, lat: 29.08, region: 1 },
  { name: '金东区', adcode: 330703, lng: 119.68, lat: 29.10, region: 2 },
  { name: '武义县', adcode: 330723, lng: 119.82, lat: 28.90, region: 3 }
];

const lngLatToPosition = (lng, lat) => {
  const x = (lng - NEW_BOUNDS.minLng) / (NEW_BOUNDS.maxLng - NEW_BOUNDS.minLng) * MAP_SIZE - MAP_SIZE / 2;
  const z = (NEW_BOUNDS.maxLat - lat) / (NEW_BOUNDS.maxLat - NEW_BOUNDS.minLat) * MAP_SIZE - MAP_SIZE / 2;
  return { x, z };
};

const initScene = () => {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1a2a);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 28, 40);
  camera.lookAt(0, 6, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  mapContainer.value.appendChild(renderer.domElement);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.left = '0px';
  labelRenderer.domElement.style.pointerEvents = 'none';
  mapContainer.value.appendChild(labelRenderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
  controls.enableZoom = true;
  controls.maxPolarAngle = Math.PI / 2.2;
  controls.target.set(0, 6, 0);
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI;

  const ambientLight = new THREE.AmbientLight(0x404060);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffeedd, 1.5);
  dirLight.position.set(10, 30, 20);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x88aadd, 0.8);
  fillLight.position.set(-10, 20, -20);
  scene.add(fillLight);

  const pointLight1 = new THREE.PointLight(0xffaa33, 0.5, 80);
  pointLight1.position.set(5, 20, -3);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xff8833, 0.5, 80);
  pointLight2.position.set(-5, 20, 2);
  scene.add(pointLight2);

  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 2000;
  const starPositions = new Float32Array(starsCount * 3);
  for (let i = 0; i < starsCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 600;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 600;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 600 - 150;
  }
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.25 });
  stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);

  jinhuaGroup = new THREE.Group();
  scene.add(jinhuaGroup);
  
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  
  window.addEventListener('mousemove', onMouseMove);
};

const onMouseMove = (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  if (camera && raycaster) {
    const allMeshes = [];
    for (let i = 1; i <= 3; i++) {
      allMeshes.push(...regionMeshes[i].meshes);
    }
    
    if (allMeshes.length > 0) {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(allMeshes);
      
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        for (let region = 1; region <= 3; region++) {
          if (regionMeshes[region].meshes.includes(hitMesh)) {
            if (currentHighlightedRegion !== region) {
              console.log(`鼠标悬浮在网格：${REGION_NAMES[region]}`);
              highlightRegion(region);
            }
            break;
          }
        }
      } else {
        if (currentHighlightedRegion !== null) {
          unhighlightAllRegions();
        }
      }
    }
  }
};

const highlightRegion = (region) => {
  console.log(`高亮区域：${REGION_NAMES[region]}`);
  
  if (currentHighlightedRegion !== null && currentHighlightedRegion !== region) {
    regionMeshes[currentHighlightedRegion].meshes.forEach(mesh => {
      if (mesh.material && meshOriginalColors.has(mesh)) {
        mesh.material.color.copy(meshOriginalColors.get(mesh));
        mesh.material.emissive.setHex(0x111111);
      }
    });
    hideInfoLabel(currentHighlightedRegion);
  }
  
  currentHighlightedRegion = region;
  
  regionMeshes[region].meshes.forEach(mesh => {
    if (mesh.material) {
      if (!meshOriginalColors.has(mesh)) {
        meshOriginalColors.set(mesh, mesh.material.color.clone());
      }
      mesh.material.color.setHex(HIGHLIGHT_COLOR);
      mesh.material.emissive.setHSL(0, 0, 0.2);
    }
  });
  
  showInfoLabel(region);
};

const showInfoLabel = (region) => {
  if (regionLabels[region]) {
    for (let i = 1; i <= 3; i++) {
      hideInfoLabel(i);
      if (regionLabels[i].name) {
        regionLabels[i].name.visible = false;
      }
    }
    
    if (regionLabels[region].info) {
      regionLabels[region].info.visible = true;
      console.log(`显示信息标签：${REGION_NAMES[region]}`);
    }
  }
};

const hideInfoLabel = (region) => {
  if (regionLabels[region]) {
    if (regionLabels[region].info) {
      regionLabels[region].info.visible = false;
    }
    if (regionLabels[region].name) {
      regionLabels[region].name.visible = true;
    }
  }
};

const unhighlightAllRegions = () => {
  console.log('取消所有高亮');
  
  for (let region = 1; region <= 3; region++) {
    regionMeshes[region].meshes.forEach(mesh => {
      if (mesh.material && meshOriginalColors.has(mesh)) {
        mesh.material.color.copy(meshOriginalColors.get(mesh));
        mesh.material.emissive.setHex(0x111111);
      }
    });
    
    hideInfoLabel(region);
  }
  
  currentHighlightedRegion = null;
};

const handleRegionClick = (region) => {
  if (controls) controls.autoRotate = false;
  
  console.log('点击区域:', REGION_NAMES[region]);

  const regionMap = {
    1: { id: '一', name: '汤村' },
    2: { id: '二', name: '莲村' },
    3: { id: '三', name: '桂村' }
  };
  
  router.push({
    path: '/TotalScreen',
    query: { 
      region: region.toString(),
      regionName: regionMap[region].name,
      regionId: regionMap[region].id,
    }
  });
};

const onClick = (event) => {
  if (camera && raycaster) {
    const allMeshes = [];
    for (let i = 1; i <= 3; i++) {
      allMeshes.push(...regionMeshes[i].meshes);
    }
    
    if (allMeshes.length > 0) {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(allMeshes);
      
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        for (let region = 1; region <= 3; region++) {
          if (regionMeshes[region].meshes.includes(hitMesh)) {
            handleRegionClick(region);
            break;
          }
        }
      }
    }
  }
};

const addRegionLabels = () => {
  mainCitrusCounties.forEach(county => {
    const { x, z } = lngLatToPosition(county.lng, county.lat);
    const region = county.region;
    const stats = REGION_STATS[region];
    const manager = REGION_MANAGERS[region];
    const offset = REGION_LABEL_OFFSETS[region];
    
    const namePosX = x + offset.x;
    const namePosZ = z + offset.z;
    
    const nameDiv = document.createElement('div');
    nameDiv.textContent = REGION_NAMES[region];
    nameDiv.setAttribute('data-region', region);
    nameDiv.style.color = 'white';
    nameDiv.style.fontSize = '36px';
    nameDiv.style.fontWeight = 'bold';
    nameDiv.style.textShadow = '3px 3px 6px rgba(0,0,0,0.9)';
    nameDiv.style.background = 'rgba(0,0,0,0.7)';
    nameDiv.style.padding = '10px 25px';
    nameDiv.style.borderRadius = '50px';
    nameDiv.style.backdropFilter = 'blur(8px)';
    nameDiv.style.letterSpacing = '3px';
    nameDiv.style.whiteSpace = 'nowrap';
    nameDiv.style.cursor = 'pointer';
    nameDiv.style.transition = 'transform 0.2s';
    nameDiv.style.border = '3px solid';
    nameDiv.style.zIndex = '10';
    
    if (region === 1) nameDiv.style.borderColor = '#2a6e3f';
    else if (region === 2) nameDiv.style.borderColor = '#33cc66';
    else nameDiv.style.borderColor = '#779649';
    
    nameDiv.addEventListener('mouseenter', (e) => {
      e.stopPropagation();
      nameDiv.style.transform = 'scale(1.05)';
      highlightRegion(region);
    });
    
    nameDiv.addEventListener('mouseleave', (e) => {
      e.stopPropagation();
      nameDiv.style.transform = 'scale(1)';
      unhighlightAllRegions();
    });
    
    nameDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      handleRegionClick(region);
    });
    
    const nameLabel = new CSS2DObject(nameDiv);
    nameLabel.position.set(namePosX, 5.5, namePosZ);
    jinhuaGroup.add(nameLabel);
    
    const infoDiv = document.createElement('div');
    infoDiv.setAttribute('data-region', region);
    infoDiv.innerHTML = `
      <div style="color: white; font-size: 28px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.9); margin-bottom: 8px;">
        ${REGION_NAMES[region]}
      </div>
      <div style="color: #ffaa00; font-size: 22px; font-weight: bold; margin: 4px 0;">
        📍 负责人：${manager}
      </div>
    `;
    
      // <div style="color: #6bb392; font-size: 22px; font-weight: bold; margin: 4px 0;">
      //   ✅ 好评率：${stats.goodRate}%
      // </div>
      // <div style="color: #a8d5ba; font-size: 20px; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(107,179,146,0.3);">
      //   🌳 智能果园示范区
      // </div>
    
    infoDiv.style.background = 'rgba(20, 30, 20, 0.95)';
    infoDiv.style.padding = '20px 30px';
    infoDiv.style.borderRadius = '20px';
    infoDiv.style.border = '3px solid';
    infoDiv.style.backdropFilter = 'blur(10px)';
    infoDiv.style.boxShadow = '0 15px 35px rgba(0,0,0,0.6), 0 0 20px rgba(107,179,146,0.3)';
    infoDiv.style.textAlign = 'center';
    infoDiv.style.lineHeight = '1.6';
    infoDiv.style.whiteSpace = 'nowrap';
    infoDiv.style.transition = 'opacity 0.3s, transform 0.3s';
    infoDiv.style.pointerEvents = 'none';
    infoDiv.style.zIndex = '100';
    
    if (region === 1) infoDiv.style.borderColor = '#2a6e3f';
    else if (region === 2) infoDiv.style.borderColor = '#33cc66';
    else infoDiv.style.borderColor = '#779649';
    
    const infoLabel = new CSS2DObject(infoDiv);
    infoLabel.position.set(namePosX, 5.5 + 5.0, namePosZ);
    infoLabel.visible = false;
    
    jinhuaGroup.add(infoLabel);
    
    regionLabels[region] = {
      name: nameLabel,
      info: infoLabel
    };
    
    console.log(`创建标签：${REGION_NAMES[region]} at (${namePosX}, ${namePosZ})`);
  });
};

const createFallbackMap = () => {
  const geometry = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
  const material = new THREE.MeshStandardMaterial({
    color: 0x2a6a3a,
    emissive: 0x0a1a0a,
    side: THREE.DoubleSide
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -0.1;
  jinhuaGroup.add(plane);

  const gridHelper = new THREE.GridHelper(MAP_SIZE, 20, 0x88aa88, 0x446644);
  gridHelper.position.y = 0;
  jinhuaGroup.add(gridHelper);
};

const createMeshFromPolygon = (coordinates, baseColor, countyName, region) => {
  try {
    const shapes = [];

    coordinates.forEach((ring, index) => {
      const points = ring.map(coord => {
        const [lng, lat] = coord;
        const { x, z } = lngLatToPosition(lng, lat);
        return new THREE.Vector2(x, z);
      });

      if (points.length > 2) {
        const first = points[0];
        const last = points[points.length - 1];
        if (Math.abs(first.x - last.x) > 0.001 || Math.abs(first.y - last.y) > 0.001) {
          points.push(new THREE.Vector2(first.x, first.y));
        }
      }

      if (index === 0) {
        try {
          const shape = new THREE.Shape(points);
          shapes.push(shape);
        } catch (e) { }
      } else {
        if (shapes.length > 0) {
          try {
            const lastShape = shapes[shapes.length - 1];
            const holePath = new THREE.Path(points);
            lastShape.holes.push(holePath);
          } catch (e) { }
        }
      }
    });

    if (shapes.length === 0) return;

    shapes.forEach(shape => {
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 2.7,
        bevelEnabled: true,
        bevelThickness: 0.15,
        bevelSize: 0.15,
        bevelSegments: 4
      });

      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: 0x111111,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0;
      mesh.userData = { region, countyName };
      
      jinhuaGroup.add(mesh);
      
      if (region >= 1 && region <= 3) {
        regionMeshes[region].meshes.push(mesh);
      }

      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(
        edges, 
        new THREE.LineBasicMaterial({ color: EDGE_COLOR })
      );
      
      line.rotation.copy(mesh.rotation);
      line.position.copy(mesh.position);
      jinhuaGroup.add(line);
      
      if (region >= 1 && region <= 3) {
        regionMeshes[region].edges.push(line);
      }
    });
  } catch (e) {
    // 静默处理
  }
};

const createCountyMap = (geojson, region) => {
  if (!geojson || !geojson.features) return;
  
  const features = geojson.features;
  const baseColor = new THREE.Color(REGION_COLORS[region]);

  features.forEach((feature, index) => {
    const geometry = feature.geometry;
    const properties = feature.properties;
    const countyName = properties ? properties.name : `县${index}`;

    if (geometry.type === 'Polygon') {
      createMeshFromPolygon(geometry.coordinates, baseColor, countyName, region);
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(polygonCoords => {
        createMeshFromPolygon(polygonCoords, baseColor, countyName, region);
      });
    }
  });
};

const fetchGeoJsonByAdcode = async (adcode) => {
  const url = `https://geo.datav.aliyun.com/areas_v3/bound/${adcode}.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`加载 adcode ${adcode} 失败:`, error);
    return null;
  }
};

const loadThreeCountyMaps = async () => {
  progressWidth.value = 20;

  try {
    const regionData = [
      { adcode: 330702, region: 1 },
      { adcode: 330703, region: 2 },
      { adcode: 330723, region: 3 }
    ];

    let loadedCount = 0;
    const totalCount = regionData.length;

    for (const item of regionData) {
      const geojson = await fetchGeoJsonByAdcode(item.adcode);
      if (geojson) {
        createCountyMap(geojson, item.region);
        loadedCount++;
        progressWidth.value = 20 + (loadedCount / totalCount) * 60;
      }
    }

    progressWidth.value = 80;
    addRegionLabels();
    progressWidth.value = 100;

    setTimeout(() => {
      loadingVisible.value = false;
      showProgressBar.value = false;
    }, 500);

  } catch (error) {
    console.error('加载地图数据失败:', error);
    createFallbackMap();
    setTimeout(() => {
      loadingVisible.value = false;
      showProgressBar.value = false;
    }, 1000);
  }
};

const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  if (controls) controls.update();
  if (stars) stars.rotation.y += 0.0001;
  if (renderer && scene && camera) renderer.render(scene, camera);
  if (labelRenderer && scene && camera) labelRenderer.render(scene, camera);
};

const handleResize = () => {
  if (camera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  if (renderer) renderer.setSize(window.innerWidth, window.innerHeight);
  if (labelRenderer) labelRenderer.setSize(window.innerWidth, window.innerHeight);
};

onMounted(() => {
  console.log('========== OrchardScene 组件已挂载 ==========');
  initScene();
  loadThreeCountyMaps();
  animate();
  window.addEventListener('resize', handleResize);
  window.addEventListener('click', onClick);
});

onBeforeUnmount(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('click', onClick);
  if (renderer && mapContainer.value) mapContainer.value.removeChild(renderer.domElement);
  if (labelRenderer && mapContainer.value) mapContainer.value.removeChild(labelRenderer.domElement);
  renderer?.dispose();
  labelRenderer?.domElement?.remove();
});
</script>

<style scoped>
.map-container {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  font-family: "Microsoft YaHei", sans-serif;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 18px;
  background: rgba(0, 0, 0, 0.7);
  padding: 20px 40px;
  border-radius: 60px;
  z-index: 1000;
  backdrop-filter: blur(5px);
  border: 1px solid #ff8c00;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-bar {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, 30px);
  width: 300px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  z-index: 1000;
}

.progress-fill {
  height: 100%;
  background: #ffaa00;
  border-radius: 2px;
  width: 0%;
  transition: width 0.3s;
}

.map-container :deep(.css2d-object) {
  pointer-events: none;
}

.map-container :deep(.css2d-object) div {
  pointer-events: auto !important;
}
</style>