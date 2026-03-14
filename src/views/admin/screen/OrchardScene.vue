<template>
  <div ref="mapContainer" class="map-container"></div>
  <!-- 左上角文字已移除 -->
  <div id="controls-panel" class="controls-panel">
    <div>🖱️ 拖动 | 滚轮缩放 | 自动旋转</div>
  </div>
  <div id="loading" class="loading" :style="{ display: loadingVisible ? 'flex' : 'none' }">
    <span>🗺️ 果园数据加载中...</span>
  </div>
  <div id="progress-bar" class="progress-bar" :style="{ display: showProgressBar ? 'block' : 'none' }">
    <div id="progress-fill" class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
  </div>
  <!-- 左下角调试信息已移除 -->
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// 响应式变量
const mapContainer = ref(null);
const loadingVisible = ref(true);
const showProgressBar = ref(true);
const progressWidth = ref(0);

// Three.js 相关变量
let scene, camera, renderer, labelRenderer, controls, stars, jinhuaGroup;
let animationFrameId = null;
let raycaster, mouse;

// 存储每个区域的网格对象
const regionMeshes = {
  1: [], // 区域①的网格
  2: [], // 区域②的网格
  3: []  // 区域③的网格
};

// 当前高亮的区域
let currentHighlightedRegion = null;

// 存储每个网格的原始颜色和发光状态
const meshOriginalColors = new Map();

// 金华市边界范围（基于实际经纬度）
const JINHUA_BOUNDS = {
  minLng: 119.2,
  maxLng: 120.8,
  minLat: 28.5,
  maxLat: 29.8
};

const MAP_SIZE = 32;

// 区域颜色定义 - 三个区域不同颜色（只用于地图区块，不用于球体）
const REGION_COLORS = {
  1: 0xff6633, // 区域①（义乌、东阳、磐安）- 橙红色
  2: 0x33cc66, // 区域②（浦江、兰溪、金东、婺城）- 翠绿色
  3: 0x3366cc  // 区域③（永康、武义）- 蓝色
};

// 金华市下属县区数据 - 使用行政区划代码
const mainCitrusCounties = [
  // 区域①：义乌、东阳、磐安（东部区域）
  { name: '义乌市', adcode: 330782, lng: 120.07, lat: 29.31, count: 60, region: 1 },
  { name: '东阳市', adcode: 330783, lng: 120.23, lat: 29.28, count: 50, region: 1 },
  { name: '磐安县', adcode: 330727, lng: 120.44, lat: 29.05, count: 45, region: 1 },
  
  // 区域②：浦江、兰溪、金东、婺城（中部区域）
  { name: '浦江县', adcode: 330726, lng: 119.88, lat: 29.45, count: 40, region: 2 },
  { name: '兰溪市', adcode: 330781, lng: 119.46, lat: 29.21, count: 55, region: 2 },
  { name: '金东区', adcode: 330703, lng: 119.68, lat: 29.10, count: 40, region: 2 },
  { name: '婺城区', adcode: 330702, lng: 119.65, lat: 29.08, count: 45, region: 2 },
  
  // 区域③：永康、武义（南部区域）
  { name: '永康市', adcode: 330784, lng: 120.03, lat: 28.90, count: 55, region: 3 },
  { name: '武义县', adcode: 330723, lng: 119.82, lat: 28.90, count: 50, region: 3 }
];

// 县区中心点（用于标记位置，但不显示文字标签）- 球体颜色保持橙色
const countyCenters = mainCitrusCounties.map(item => ({
  name: item.name,
  lng: item.lng,
  lat: item.lat,
  region: item.region
}));

// 经纬度转换函数
const lngLatToPosition = (lng, lat) => {
  const x = (lng - JINHUA_BOUNDS.minLng) / (JINHUA_BOUNDS.maxLng - JINHUA_BOUNDS.minLng) * MAP_SIZE - MAP_SIZE / 2;
  const z = (JINHUA_BOUNDS.maxLat - lat) / (JINHUA_BOUNDS.maxLat - JINHUA_BOUNDS.minLat) * MAP_SIZE - MAP_SIZE / 2;
  return { x, z };
};

// 初始化场景
const initScene = () => {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1a2a);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 18, 30);
  camera.lookAt(0, 2, 0);

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
  controls.autoRotateSpeed = 0.3;
  controls.enableZoom = true;
  controls.maxPolarAngle = Math.PI / 2.2;
  controls.target.set(0, 2, 0);

  // 灯光
  const ambientLight = new THREE.AmbientLight(0x404060);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
  dirLight.position.set(10, 20, 15);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x88aadd, 0.6);
  fillLight.position.set(-10, 10, -15);
  scene.add(fillLight);

  const pointLight1 = new THREE.PointLight(0xffaa33, 0.3, 40);
  pointLight1.position.set(5, 8, -3);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xff8833, 0.3, 40);
  pointLight2.position.set(-5, 8, 2);
  scene.add(pointLight2);

  // 星空
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
  
  // 初始化 Raycaster 和鼠标向量
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  
  // 添加鼠标移动监听
  window.addEventListener('mousemove', onMouseMove);
};

// 鼠标移动事件处理
const onMouseMove = (event) => {
  // 计算鼠标位置归一化坐标 (-1 到 1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // 更新射线
  raycaster.setFromCamera(mouse, camera);
  
  // 获取所有网格对象
  const allMeshes = [];
  for (let i = 1; i <= 3; i++) {
    allMeshes.push(...regionMeshes[i]);
  }
  
  // 检测与网格的交点
  const intersects = raycaster.intersectObjects(allMeshes);
  
  if (intersects.length > 0) {
    // 获取第一个被击中的网格
    const hitMesh = intersects[0].object;
    
    // 查找该网格属于哪个区域
    for (let region = 1; region <= 3; region++) {
      if (regionMeshes[region].includes(hitMesh)) {
        // 如果当前高亮的区域不是这个区域，则切换高亮
        if (currentHighlightedRegion !== region) {
          highlightRegion(region);
        }
        break;
      }
    }
  } else {
    // 如果没有击中任何网格，且当前有高亮区域，则取消高亮
    if (currentHighlightedRegion !== null) {
      unhighlightAllRegions();
    }
  }
};

// 高亮指定区域
const highlightRegion = (region) => {
  // 先取消所有区域的高亮
  unhighlightAllRegions();
  
  // 设置当前高亮区域
  currentHighlightedRegion = region;
  
  // 为该区域的所有网格添加发光效果
  regionMeshes[region].forEach(mesh => {
    if (mesh.material) {
      // 保存原始颜色（如果还没保存）
      if (!meshOriginalColors.has(mesh)) {
        meshOriginalColors.set(mesh, mesh.material.color.clone());
      }
      
      // 增强亮度和发光效果
      mesh.material.emissive.setHSL(0, 0, 0.3); // 增加自发光
      mesh.material.color.multiplyScalar(1.3); // 提高亮度
    }
  });
};

// 取消所有区域的高亮
const unhighlightAllRegions = () => {
  if (currentHighlightedRegion === null) return;
  
  // 恢复之前高亮区域的所有网格
  for (let region = 1; region <= 3; region++) {
    regionMeshes[region].forEach(mesh => {
      if (mesh.material && meshOriginalColors.has(mesh)) {
        // 恢复原始颜色
        mesh.material.color.copy(meshOriginalColors.get(mesh));
        mesh.material.emissive.setHex(0x111111); // 恢复原始自发光
      }
    });
  }
  
  currentHighlightedRegion = null;
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
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 2
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
      
      // 添加用户数据，标记所属区域
      mesh.userData = { region, countyName };
      
      jinhuaGroup.add(mesh);
      
      // 将该网格添加到对应区域的数组中
      if (region >= 1 && region <= 3) {
        regionMeshes[region].push(mesh);
      }

      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x88aa88, transparent: true, opacity: 0.3 }));
      line.rotation.copy(mesh.rotation);
      line.position.copy(mesh.position);
      jinhuaGroup.add(line);
    });
  } catch (e) {
    // console.warn('创建网格失败:', countyName);
  }
};

// 创建县级地图 - 根据区域分配颜色（同一区域颜色相同）
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

// 添加县区标记点 - 使用橙色，不按区域区分
const addCountyMarkers = () => {
  countyCenters.forEach(county => {
    const { x, z } = lngLatToPosition(county.lng, county.lat);

    // 县区标记点 - 统一使用橙色
    const markerGeom = new THREE.SphereGeometry(0.5, 12);
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00, // 橙色
      emissive: 0x332200
    });
    const marker = new THREE.Mesh(markerGeom, markerMat);
    marker.position.set(x, 0.4, z);
    jinhuaGroup.add(marker);
    
    // 添加一个小光环 - 也使用橙色
    const glowGeom = new THREE.SphereGeometry(0.7, 8);
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      transparent: true,
      opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.position.set(x, 0.4, z);
    jinhuaGroup.add(glow);
  });
};

// 添加桔园分布点 - 保持原始的随机橙色调
const addOrchards = () => {
  mainCitrusCounties.forEach(county => {
    const { x, z } = lngLatToPosition(county.lng, county.lat);

    for (let i = 0; i < county.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.8 + Math.random() * 1.5;
      const dx = Math.cos(angle) * radius;
      const dz = Math.sin(angle) * radius;

      // 原始的随机橙色调（0.05-0.15之间的色相）
      const hue = 0.05 + Math.random() * 0.1;
      const size = 0.08 + Math.random() * 0.1;

      const fruitGeom = new THREE.SphereGeometry(size, 6);
      const fruitMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue, 0.9, 0.6),
        emissive: new THREE.Color().setHSL(hue, 0.8, 0.1)
      });
      const fruit = new THREE.Mesh(fruitGeom, fruitMat);
      fruit.position.set(x + dx, 0.2 + Math.random() * 0.3, z + dz);
      jinhuaGroup.add(fruit);
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

// 加载金华市所有县区的地图数据
const loadAllCountyMaps = async () => {
  progressWidth.value = 20;

  try {
    // 按区域分组加载数据
    const region1Adcodes = [330782, 330783, 330727]; // 义乌、东阳、磐安
    const region2Adcodes = [330726, 330781, 330703, 330702]; // 浦江、兰溪、金东、婺城
    const region3Adcodes = [330784, 330723]; // 永康、武义

    let loadedCount = 0;
    const totalCount = region1Adcodes.length + region2Adcodes.length + region3Adcodes.length;

    // 加载区域①的数据
    for (const adcode of region1Adcodes) {
      const geojson = await fetchGeoJsonByAdcode(adcode);
      if (geojson) {
        createCountyMap(geojson, 1);
        loadedCount++;
        progressWidth.value = 20 + (loadedCount / totalCount) * 60;
      }
    }

    // 加载区域②的数据
    for (const adcode of region2Adcodes) {
      const geojson = await fetchGeoJsonByAdcode(adcode);
      if (geojson) {
        createCountyMap(geojson, 2);
        loadedCount++;
        progressWidth.value = 20 + (loadedCount / totalCount) * 60;
      }
    }

    // 加载区域③的数据
    for (const adcode of region3Adcodes) {
      const geojson = await fetchGeoJsonByAdcode(adcode);
      if (geojson) {
        createCountyMap(geojson, 3);
        loadedCount++;
        progressWidth.value = 20 + (loadedCount / totalCount) * 60;
      }
    }

    progressWidth.value = 80;

    // 添加县区标记点和桔园分布
    addCountyMarkers();
    addOrchards();

    progressWidth.value = 100;

    setTimeout(() => {
      loadingVisible.value = false;
      showProgressBar.value = false;
    }, 500);

  } catch (error) {
    console.error('加载地图数据失败:', error);
    createFallbackMap();
    addCountyMarkers();
    addOrchards();

    setTimeout(() => {
      loadingVisible.value = false;
      showProgressBar.value = false;
    }, 1000);
  }
};

// 动画循环
const animate = () => {
  requestAnimationFrame(animate);
  
  // 每帧都进行射线检测，实现实时交互
  if (camera && controls && raycaster) {
    // 更新射线检测（鼠标位置已在 mousemove 中更新）
    const allMeshes = [];
    for (let i = 1; i <= 3; i++) {
      allMeshes.push(...regionMeshes[i]);
    }
    
    if (allMeshes.length > 0) {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(allMeshes);
      
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        for (let region = 1; region <= 3; region++) {
          if (regionMeshes[region].includes(hitMesh)) {
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
  loadAllCountyMaps();
  animate();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('mousemove', onMouseMove);
  if (renderer && mapContainer.value) {
    mapContainer.value.removeChild(renderer.domElement);
  }
  if (labelRenderer && mapContainer.value) {
    mapContainer.value.removeChild(labelRenderer.domElement);
  }
  // 清理 Three.js 资源
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

/* 左上角文字已移除 */

.controls-panel {
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
  border: 1px solid #ff8c0044;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
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

/* 左下角调试信息已移除 */
</style>