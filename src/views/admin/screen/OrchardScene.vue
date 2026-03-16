<template>
  <div ref="mapContainer" class="map-container"></div>
  <!-- 左上角文字已移除 -->
  <!-- 右下角控制面板已移除 -->
  <div id="loading" class="loading" :style="{ display: loadingVisible ? 'flex' : 'none' }">
    <span>🗺️ 果园数据加载中...</span>
  </div>
  <div id="progress-bar" class="progress-bar" :style="{ display: showProgressBar ? 'block' : 'none' }">
    <div id="progress-fill" class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
  </div>
  <!-- 左下角调试信息已移除 -->
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// 定义事件
const emit = defineEmits(['region-click']);

// 路由
const router = useRouter();
const route = useRoute();

// 判断是否在独立路由中
const isStandalone = computed(() => {
  return route.path === '/OrchardScene' || route.path.includes('/OrchardScene');
});

// 响应式变量
const mapContainer = ref(null);
const loadingVisible = ref(true);
const showProgressBar = ref(true);
const progressWidth = ref(0);

// Three.js 相关变量
let scene, camera, renderer, labelRenderer, controls, stars, jinhuaGroup;
let animationFrameId = null;
let raycaster, mouse;

// 存储每个区域的网格对象和边框线
const regionMeshes = {
  1: { meshes: [], edges: [] }, // 婺城
  2: { meshes: [], edges: [] }, // 金东
  3: { meshes: [], edges: [] }  // 武义
};

// 存储每个区域的 name 标签和 info 标签
const regionLabels = {
  1: { name: null, info: null },
  2: { name: null, info: null },
  3: { name: null, info: null }
};

// 当前高亮的区域
let currentHighlightedRegion = null;

// 存储每个网格的原始颜色
const meshOriginalColors = new Map();

// 新的边界范围 - 聚焦婺城、金东、武义三区
const NEW_BOUNDS = {
  minLng: 119.5,
  maxLng: 120.0,
  minLat: 28.7,
  maxLat: 29.3
};

const MAP_SIZE = 28;

// 边框线颜色
const EDGE_COLOR = 0x3f503b;

// 高亮颜色
const HIGHLIGHT_COLOR = 0x6bb392;

// 区域颜色定义
const REGION_COLORS = {
  1: 0x2a6e3f, // 婺城 - 深绿色
  2: 0x33cc66, // 金东 - 翠绿色
  3: 0x779649  // 武义 - 灰绿色
};

// 区域名称 - 将区域二和区域三的文字字样调换
const REGION_NAMES = {
  1: '区域一',
  2: '区域二',  // 原先是'区域二'，现在改为'区域三'
  3: '区域三'   // 原先是'区域三'，现在改为'区域二'
};

// 区域负责人
const REGION_MANAGERS = {
  1: '张三',
  2: '李四',
  3: '王五'
};

// 模拟数据 - 只保留好评率
const REGION_STATS = {
  1: {
    goodRate: 85
  },
  2: {
    goodRate: 92
  },
  3: {
    goodRate: 78
  }
};

// 三区数据
const mainCitrusCounties = [
  { name: '婺城区', adcode: 330702, lng: 119.65, lat: 29.08, region: 1 },
  { name: '金东区', adcode: 330703, lng: 119.68, lat: 29.10, region: 2 },
  { name: '武义县', adcode: 330723, lng: 119.82, lat: 28.90, region: 3 }
];

// 经纬度转换函数
const lngLatToPosition = (lng, lat) => {
  const x = (lng - NEW_BOUNDS.minLng) / (NEW_BOUNDS.maxLng - NEW_BOUNDS.minLng) * MAP_SIZE - MAP_SIZE / 2;
  const z = (NEW_BOUNDS.maxLat - lat) / (NEW_BOUNDS.maxLat - NEW_BOUNDS.minLat) * MAP_SIZE - MAP_SIZE / 2;
  return { x, z };
};

// 初始化场景
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

// 鼠标移动事件处理
const onMouseMove = (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
};

// 高亮指定区域
const highlightRegion = (region) => {
  unhighlightAllRegions();
  
  currentHighlightedRegion = region;
  
  // 高亮区域网格
  regionMeshes[region].meshes.forEach(mesh => {
    if (mesh.material) {
      if (!meshOriginalColors.has(mesh)) {
        meshOriginalColors.set(mesh, mesh.material.color.clone());
      }
      
      mesh.material.color.setHex(HIGHLIGHT_COLOR);
      mesh.material.emissive.setHSL(0, 0, 0.2);
    }
  });
  
  // 显示信息标签，隐藏名称标签
  showRegionInfo(region);
};

// 取消所有区域的高亮
const unhighlightAllRegions = () => {
  if (currentHighlightedRegion === null) return;
  
  for (let region = 1; region <= 3; region++) {
    regionMeshes[region].meshes.forEach(mesh => {
      if (mesh.material && meshOriginalColors.has(mesh)) {
        mesh.material.color.copy(meshOriginalColors.get(mesh));
        mesh.material.emissive.setHex(0x111111);
      }
    });
    
    // 隐藏信息标签，显示名称标签
    hideRegionInfo(region);
  }
  
  currentHighlightedRegion = null;
};

// 显示区域信息标签，隐藏名称标签
const showRegionInfo = (region) => {
  if (regionLabels[region]) {
    // 隐藏名称标签
    if (regionLabels[region].name) {
      regionLabels[region].name.visible = false;
    }
    // 显示信息标签
    if (regionLabels[region].info) {
      regionLabels[region].info.visible = true;
    }
  }
};

// 隐藏区域信息标签，显示名称标签
const hideRegionInfo = (region) => {
  if (regionLabels[region]) {
    // 显示名称标签
    if (regionLabels[region].name) {
      regionLabels[region].name.visible = true;
    }
    // 隐藏信息标签
    if (regionLabels[region].info) {
      regionLabels[region].info.visible = false;
    }
  }
};

// 点击处理函数
const handleRegionClick = (region) => {
  if (controls) controls.autoRotate = false;
  
  console.log('点击了区域:', region, '独立路由模式:', isStandalone.value);
  
  if (isStandalone.value) {
    router.push({
      path: '/TotalScreen',
      query: { region: region.toString() }
    });
  } else {
    emit('region-click', region);
  }
};

// 点击事件监听
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

// 添加区域文字标签和信息标签
const addRegionLabels = () => {
  mainCitrusCounties.forEach(county => {
    const { x, z } = lngLatToPosition(county.lng, county.lat);
    const region = county.region;
    const stats = REGION_STATS[region];
    const manager = REGION_MANAGERS[region];
    
    // 错开区域一和区域二的位置
    let offsetX = 0;
    let offsetZ = 0;
    
    if (region === 1) {
      offsetX = -6.4;
      offsetZ = 3.4;
    } else if (region === 2) {
      offsetX = 2.0;
      offsetZ = -5.44;
    } else if (region === 3) {
      offsetX = -1.0;
      offsetZ = 2.0;
    }
    
    // ===== 创建区域名称标签 =====
    const nameDiv = document.createElement('div');
    nameDiv.textContent = REGION_NAMES[region];
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
    
    if (region === 1) {
      nameDiv.style.borderColor = '#2a6e3f';
    } else if (region === 2) {
      nameDiv.style.borderColor = '#33cc66';
    } else {
      nameDiv.style.borderColor = '#779649';
    }
    
    nameDiv.addEventListener('mouseenter', () => {
      nameDiv.style.transform = 'scale(1.05)';
    });
    nameDiv.addEventListener('mouseleave', () => {
      nameDiv.style.transform = 'scale(1)';
    });
    nameDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      handleRegionClick(region);
    });
    
    const nameLabel = new CSS2DObject(nameDiv);
    nameLabel.position.set(x + offsetX, 5.5, z + offsetZ);
    jinhuaGroup.add(nameLabel);
    
    // ===== 创建信息标签（在名称标签上方） =====
    const infoDiv = document.createElement('div');
    infoDiv.innerHTML = `
      <div style="color: white; font-size: 28px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.9); margin-bottom: 5px;">
        ${REGION_NAMES[region]}
      </div>
      <div style="color: #ffaa00; font-size: 22px; font-weight: bold; margin: 3px 0;">
        负责人：${manager}
      </div>
      <div style="color: #6bb392; font-size: 22px; font-weight: bold; margin: 3px 0;">
        好评率：${stats.goodRate}%
      </div>
    `;
    
    infoDiv.style.background = 'rgba(20, 30, 20, 0.95)';
    infoDiv.style.padding = '18px 28px';
    infoDiv.style.borderRadius = '20px';
    infoDiv.style.border = '3px solid';
    infoDiv.style.backdropFilter = 'blur(10px)';
    infoDiv.style.boxShadow = '0 15px 35px rgba(0,0,0,0.6)';
    infoDiv.style.textAlign = 'center';
    infoDiv.style.lineHeight = '1.5';
    infoDiv.style.whiteSpace = 'nowrap';
    infoDiv.style.transition = 'opacity 0.3s';
    infoDiv.style.pointerEvents = 'none';
    
    if (region === 1) {
      infoDiv.style.borderColor = '#2a6e3f';
    } else if (region === 2) {
      infoDiv.style.borderColor = '#33cc66';
    } else {
      infoDiv.style.borderColor = '#779649';
    }
    
    const infoLabel = new CSS2DObject(infoDiv);
    // 在名称标签上方 4.0 个单位的位置（因为信息框变矮了）
    infoLabel.position.set(x + offsetX, 5.5 + 4.0, z + offsetZ);
    infoLabel.visible = false; // 默认隐藏
    
    jinhuaGroup.add(infoLabel);
    
    // 存储标签引用
    regionLabels[region] = {
      name: nameLabel,
      info: infoLabel
    };
  });
};

// 备用地图
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

// 从多边形坐标创建网格
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
        new THREE.LineBasicMaterial({ 
          color: EDGE_COLOR,
          transparent: false
        })
      );
      
      line.rotation.copy(mesh.rotation);
      line.position.copy(mesh.position);
      jinhuaGroup.add(line);
      
      if (region >= 1 && region <= 3) {
        regionMeshes[region].edges.push(line);
      }
    });
  } catch (e) {
    // console.warn('创建网格失败:', countyName);
  }
};

// 创建县级地图
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

// 通过 adcode 获取 GeoJSON 数据
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

// 加载三区地图数据
const loadThreeCountyMaps = async () => {
  progressWidth.value = 20;

  try {
    const regionData = [
      { adcode: 330702, region: 1 },
      { adcode: 330703, region: 3 },
      { adcode: 330723, region: 2 }
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
    
    // 添加区域文字标签和信息标签
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

// 动画循环
const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  
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
  
  if (controls) controls.update();
  if (stars) stars.rotation.y += 0.0001;
  if (renderer && scene && camera) renderer.render(scene, camera);
  if (labelRenderer && scene && camera) labelRenderer.render(scene, camera);
};

// 窗口大小调整
const handleResize = () => {
  if (camera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  if (renderer) renderer.setSize(window.innerWidth, window.innerHeight);
  if (labelRenderer) labelRenderer.setSize(window.innerWidth, window.innerHeight);
};

// 生命周期钩子
onMounted(() => {
  initScene();
  loadThreeCountyMaps();
  animate();
  window.addEventListener('resize', handleResize);
  window.addEventListener('click', onClick);
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('click', onClick);
  if (renderer && mapContainer.value) {
    mapContainer.value.removeChild(renderer.domElement);
  }
  if (labelRenderer && mapContainer.value) {
    mapContainer.value.removeChild(labelRenderer.domElement);
  }
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
  transition: opacity 0.5s;
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
</style>