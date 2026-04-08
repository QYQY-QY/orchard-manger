<!-- OrchardScene.vue - 果园 3D 地图大屏 -->
<template>
  <div ref="mapContainer" class="map-container"></div>
  <!-- 加载提示框，加载时显示 -->
  <div id="loading" class="loading" :style="{ display: loadingVisible ? 'flex' : 'none' }">
    <span>果园数据加载中...</span>
  </div>
  <!-- 进度条，显示加载进度 -->
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

//父子组件事件触发，合作社区域被点击
const emit = defineEmits(['region-click']);
const router = useRouter();
const route = useRoute();

//判断是否为独立展示页面
const isStandalone = computed(() => {
  return route.path === '/OrchardScene' || route.path.includes('/OrchardScene');
});

//地图容器
const mapContainer = ref(null);
//加载提示的隐藏/显示
const loadingVisible = ref(true);
//进度条的隐藏/显示控制
const showProgressBar = ref(true);
//进度条宽度百分比
const progressWidth = ref(0);

//three.js核心对象
let scene, camera, renderer, labelRenderer, controls, stars, cunGroup;
//动画帧id
let animationFrameId = null;
//射线投射器
let raycaster, mouse;

//村庄的3d模型边界
const regionMeshes = {
  1: { meshes: [], edges: [] },
  2: { meshes: [], edges: [] },
  3: { meshes: [], edges: [] }
};

//设置合作社村标签：名称标签和详情面板统一管理
const regionLabels = {
  1: { name: null, info: null },
  2: { name: null, info: null },
  3: { name: null, info: null }
};

//当前高亮的合作社区域id
let currentHighlightedRegion = null;
//保存模型原始颜色，用于取消高亮恢复
const meshOriginalColors = new Map();

//合作社经纬度范围
const NEW_BOUNDS = {
  minLng: 119.5,
  maxLng: 120.0,
  minLat: 28.7,
  maxLat: 29.3
};

//地图平面尺寸
const MAP_SIZE = 28;
//区域边缘线的颜色
const EDGE_COLOR = 0x3f503b;
//鼠标悬浮时的高亮颜色
const HIGHLIGHT_COLOR = 0x6bb392;

//合作社的区域颜色
const REGION_COLORS = {
  1: 0x2a6e3f,
  2: 0x33cc66,
  3: 0x779649
};

//合作社村庄名称
const REGION_NAMES = {
  1: '汤村',
  2: '莲村',
  3: '桂村'
};

//负责人信息
const REGION_MANAGERS = {
  1: '**',
  2: '**',
  3: '**'
};

//标签偏移位置
const REGION_LABEL_OFFSETS = {
  1: { x: -6.4, z: 3.4 },
  2: { x: 2.0, z: -5.44 },
  3: { x: -1.0, z: 2.0 }
};

// 好感度
const REGION_STATS = {
  1: { goodRate: 85 },
  2: { goodRate: 92 },
  3: { goodRate: 78 }
};

//合作社村庄地图配置
const mainCitrusCounties = [
  { name: '汤村', adcode: 330702, lng: 119.65, lat: 29.08, region: 1 },
  { name: '莲村', adcode: 330703, lng: 119.68, lat: 29.10, region: 2 },
  { name: '桂村', adcode: 330723, lng: 119.82, lat: 28.90, region: 3 }
];

//!!!!!!!!
//经纬度3D平面坐标,把真实地理坐标映射成Three.js世界坐标
//!!!!!!!!
const lngLatToPosition = (lng, lat) => {
  const x = (lng - NEW_BOUNDS.minLng) / (NEW_BOUNDS.maxLng - NEW_BOUNDS.minLng) * MAP_SIZE - MAP_SIZE / 2;
  const z = (NEW_BOUNDS.maxLat - lat) / (NEW_BOUNDS.maxLat - NEW_BOUNDS.minLat) * MAP_SIZE - MAP_SIZE / 2;
  return { x, z };
};


//———————————————————————————
//——————3d场景初始化搭建——————
//———————————————————————————

//初始化three.js创建
const initScene = () => {
  //创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1a2a);

  //##创建透视相机，调整3d模型视角
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  // 相机初始位置：斜上方俯视整个3D地图
  camera.position.set(0, 28, 40);
  // 相机看向地图中心点
  camera.lookAt(0, 6, 0);

  // ##创建 WebGL 渲染器，让3D画面画到屏幕上
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  //设置像素比是设备的像素比，防止画布模糊
  renderer.setPixelRatio(window.devicePixelRatio);
  mapContainer.value.appendChild(renderer.domElement);

  //##css2D标签渲染器，合作社村庄的文字描述
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.left = '0px';
  //禁止标签阻拦3D场景鼠标事件
  labelRenderer.domElement.style.pointerEvents = 'none';
  mapContainer.value.appendChild(labelRenderer.domElement);

  //轨道控制器，控制旋转，缩放，阻尼，实现自旋转
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

  //光照系统，构建真实物理光影层次
  //环境光设置，均匀照亮整个场景
  const ambientLight = new THREE.AmbientLight(0x404060);
  scene.add(ambientLight);

  //主平行光，主要明暗效果
  const dirLight = new THREE.DirectionalLight(0xffeedd, 1.5);
  dirLight.position.set(10, 30, 20);
  scene.add(dirLight);

  //测光补光
  const fillLight = new THREE.DirectionalLight(0x88aadd, 0.8);
  fillLight.position.set(-10, 20, -20);
  scene.add(fillLight);

  //点光源1
  const pointLight1 = new THREE.PointLight(0xffaa33, 0.5, 80);
  pointLight1.position.set(5, 20, -3);
  scene.add(pointLight1);

  //点光源2
  const pointLight2 = new THREE.PointLight(0xff8833, 0.5, 80);
  pointLight2.position.set(-5, 20, 2);
  scene.add(pointLight2);

  //星空背景，使用BufferGeometry提升渲染性能，2000个粒子模拟星空
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

  //村级地图组，让所有模型统一旋转，移动，删除
  cunGroup = new THREE.Group();
  scene.add(cunGroup);

  //射线拾取，鼠标交互
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  //绑定鼠标移动事件，实现实时拾取
  window.addEventListener('mousemove', onMouseMove);
};

//鼠标移动事件，获取3D合作社区域模型，3D交互相关
const onMouseMove = (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (camera && raycaster) {
    //收集所有可拾取模型
    const allMeshes = [];
    for (let i = 1; i <= 3; i++) {
      allMeshes.push(...regionMeshes[i].meshes);
    }

    if (allMeshes.length > 0) {
      //从相机发射射线检测相交物体
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(allMeshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        //匹配模型所属区域并高亮
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
        //无相交则清楚所有高亮
        if (currentHighlightedRegion !== null) {
          unhighlightAllRegions();
        }
      }
    }
  }
};

//合作社区域被点击（鼠标移动到上方触发），改变颜色以及发光，显示2D标签
const highlightRegion = (region) => {
  console.log(`高亮区域：${REGION_NAMES[region]}`);

  //恢复上一个高亮区域
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

  //设置当前区域高亮发光效果
  regionMeshes[region].meshes.forEach(mesh => {
    if (mesh.material) {
      if (!meshOriginalColors.has(mesh)) {
        //缓存原始颜色，只在首次高亮时保存
        meshOriginalColors.set(mesh, mesh.material.color.clone());
      }
      mesh.material.color.setHex(HIGHLIGHT_COLOR);
      mesh.material.emissive.setHSL(0, 0, 0.2);
    }
  });

  showInfoLabel(region);
};

//控制标签的显示和隐藏，悬浮展示
const showInfoLabel = (region) => {
  if (regionLabels[region]) {
    //统一隐藏其他区域信息
    for (let i = 1; i <= 3; i++) {
      hideInfoLabel(i);
      if (regionLabels[i].name) {
        regionLabels[i].name.visible = false;
      }
    }

    if (regionLabels[region].info) {
      //显示当前区域详情
      regionLabels[region].info.visible = true;
      console.log(`显示信息标签：${REGION_NAMES[region]}`);
    }
  }
};

//隐藏信息面板，恢复名称标签显示
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

//取消所有区域高亮，hi夫原始材质
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

//设置合作社区域点击后跳转效果
const handleRegionClick = (region) => {
  if (controls) controls.autoRotate = false;

  console.log('点击合作社区域:', REGION_NAMES[region]);

  const regionMap = {
    1: { id: '一', name: '汤村' },
    2: { id: '二', name: '莲村' },
    3: { id: '三', name: '桂村' }
  };

  //跳转到总屏
  router.push({
    path: '/TotalScreen',
    query: {
      region: region.toString(),
      regionName: regionMap[region].name,
      regionId: regionMap[region].id,
    }
  });
};

//全局点击事件，通过射线检测实现3D模型点击交互
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

//合作社区域上方的标签信息展示
const addRegionLabels = () => {
  mainCitrusCounties.forEach(county => {
    const { x, z } = lngLatToPosition(county.lng, county.lat);
    const region = county.region;
    const stats = REGION_STATS[region];
    const manager = REGION_MANAGERS[region];
    const offset = REGION_LABEL_OFFSETS[region];

    const namePosX = x + offset.x;
    const namePosZ = z + offset.z;

    //名称标签的DOM
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

    //按照区域设置边框色
    if (region === 1) nameDiv.style.borderColor = '#2a6e3f';
    else if (region === 2) nameDiv.style.borderColor = '#33cc66';
    else nameDiv.style.borderColor = '#779649';

    //鼠标交互效果设置
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

    //转为3D空间标签
    const nameLabel = new CSS2DObject(nameDiv);
    nameLabel.position.set(namePosX, 5.5, namePosZ);
    cunGroup.add(nameLabel);

    //信息面板
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

    //这些都是信息面板的属性控制
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

    cunGroup.add(infoLabel);

    //存入换成标签
    regionLabels[region] = {
      name: nameLabel,
      info: infoLabel
    };

    console.log(`创建标签：${REGION_NAMES[region]} at (${namePosX}, ${namePosZ})`);
  });
};

//降级方案，加载失败的时候显示基础平面网格，保证系统的连续性
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
  cunGroup.add(plane);

  //网格的辅助线
  const gridHelper = new THREE.GridHelper(MAP_SIZE, 20, 0x88aa88, 0x446644);
  gridHelper.position.y = 0;
  cunGroup.add(gridHelper);
};

//————————————————————————————————————————————
//核心部分：根据合作社的经纬度边缘坐标生成3D模型
//——————————————————————————————————————————————
const createMeshFromPolygon = (coordinates, baseColor, countyName, region) => {
  try {
    const shapes = [];

    coordinates.forEach((ring, index) => {
      //经纬度坐标转化为模型里面的3D坐标
      const points = ring.map(coord => {
        const [lng, lat] = coord;
        const { x, z } = lngLatToPosition(lng, lat);
        return new THREE.Vector2(x, z);
      });

      //自动闭合多边形，保证集合体完整性
      if (points.length > 2) {
        const first = points[0];
        const last = points[points.length - 1];
        if (Math.abs(first.x - last.x) > 0.001 || Math.abs(first.y - last.y) > 0.001) {
          points.push(new THREE.Vector2(first.x, first.y));
        }
      }

      //外轮廓控制
      if (index === 0) {
        try {
          const shape = new THREE.Shape(points);
          shapes.push(shape);
        } catch (e) { }
      } else {
        //内孔处理
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
      // 使用 ExtrudeGeometry 挤压几何体
      // //把2D轮廓挤压成3D有高度的模型
      const geometry = new THREE.ExtrudeGeometry(shape, {
        //同时设置高度，开启倒角，让模型更加立体圆润
        depth: 2.5,
        bevelEnabled: true,
        bevelThickness: 0.15,
        bevelSize: 0.15,
        bevelSegments: 4
      });

      //设置模型的物理材质——受灯光打光影响质感更强
      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: 0x111111,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });

      //创建3D网络模型
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0;
      mesh.userData = { region, countyName };

      cunGroup.add(mesh);

      if (region >= 1 && region <= 3) {
        regionMeshes[region].meshes.push(mesh);
      }

      //给模型添加边框线，增强地块轮廓
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: EDGE_COLOR })
      );

      line.rotation.copy(mesh.rotation);
      line.position.copy(mesh.position);
      cunGroup.add(line);

      if (region >= 1 && region <= 3) {
        regionMeshes[region].edges.push(line);
      }
    });
  } catch (e) {
    // 静默处理，保证程序健壮性
  }
};

//解析geoJson生成3D模型
const createCountyMap = (geojson, region) => {
  if (!geojson || !geojson.features) return;

  const features = geojson.features;
  const baseColor = new THREE.Color(REGION_COLORS[region]);

  features.forEach((feature, index) => {
    const geometry = feature.geometry;
    const properties = feature.properties;
    const countyName = properties ? properties.name : `合作社区域${index}`;

    if (geometry.type === 'Polygon') {
      createMeshFromPolygon(geometry.coordinates, baseColor, countyName, region);
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(polygonCoords => {
        createMeshFromPolygon(polygonCoords, baseColor, countyName, region);
      });
    }
  });
};

//从阿里云和高德加载合作社村庄地图边界
const fetchGeoJsonByAdcode = async (adcode) => {
  try {
    // 关键：从本地 assets 动态导入对应 adcode 的 JSON
    const geojson = await import(`@/assets/geoJson/${adcode}.json`);
    // 兼容 vite / webpack 两种打包工具
    return geojson.default || geojson;
  } catch (error) {
    console.error(`本地文件加载失败 ${adcode}.json:`, error);
    return null;
  }
};

//批量添加三个合作社的地理数据，带进度条反馈
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

//3D渲染循环，每一帧重新绘制画面，让3D效果动起来
const animate = () => {
  animationFrameId = requestAnimationFrame(animate);
  //更新控制器，控制阻尼和旋转
  if (controls) controls.update();
  //设置星空背景缓慢旋转
  if (stars) stars.rotation.y += 0.0001;
  //将前面设置的3D场景和2D标签渲染到画面上
  if (renderer && scene && camera) renderer.render(scene, camera);
  if (labelRenderer && scene && camera) labelRenderer.render(scene, camera);
};

//窗口大小变化时自适应3D渲染场景
const handleResize = () => {
  if (camera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  if (renderer) renderer.setSize(window.innerWidth, window.innerHeight);
  if (labelRenderer) labelRenderer.setSize(window.innerWidth, window.innerHeight);
};

//生命周期，挂载时启动3D
onMounted(() => {
  console.log('========== OrchardScene 组件已挂载 ==========');
  //初始化3D场景，加载3D场景，启动渲染循环
  initScene();
  loadThreeCountyMaps();
  animate();
  window.addEventListener('resize', handleResize);
  window.addEventListener('click', onClick);
});

//销毁时释放3D资源，防止页面卡顿
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
/* 3D容器全屏布局 */
.map-container {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  font-family: "Microsoft YaHei", sans-serif;
}

/* 加载遮罩样式 */
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

/* 进度条展示 */
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

/* .map-container :deep(.css2d-object) {
  pointer-events: none;
} */

.map-container :deep(.css2d-object) div {
  pointer-events: auto !important;
}
</style>