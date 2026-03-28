<template>
  <header class="screen-header">
    <!-- CSS 波纹背景（同心圆环） -->
    <div class="wave-bg">
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
    </div>

    <!-- Canvas 粒子背景（仅绿色流动粒子，无星空） -->
    <canvas ref="waveCanvas" class="wave-canvas"></canvas>

    <div class="header-left"></div>

    <div class="header-title">
      <span class="title-chinese">一树一码智慧管理平台</span>
    </div>

    <div class="header-right">
      <div class="time-display">
        <div class="time-label">实时数据</div>
        <div class="time-value">{{ updateTime }}</div>
      </div>
      <el-button class="exit-btn" @click="handleExit" :icon="SwitchButton">
        退出
      </el-button>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { SwitchButton } from '@element-plus/icons-vue'
// import { useUserStore } from '@/stores'

const router = useRouter()
const updateTime = ref(new Date().toLocaleString())

// const useStore=useUserStore()

const handleExit = () => {
  router.push('/adminarea')
}

// ==================== Canvas 粒子特效（无星空） ====================
const waveCanvas = ref(null)
let ctx = null
let canvasWidth = 0
let canvasHeight = 0
let animationId = null
let particles = []
const MAX_PARTICLES = 35
const CENTER_RANGE = 0.3

// 初始化粒子
function initParticles(count) {
  for (let i = 0; i < count; i++) {
    particles.push(createParticle())
  }
}

function createParticle() {
  return {
    x: canvasWidth * (0.3 + Math.random() * 0.4),
    y: canvasHeight * (0.3 + Math.random() * 0.4),
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    radius: 2 + Math.random() * 4,
    alpha: 0.3 + Math.random() * 0.7,
    color: `rgba(${100 + Math.random() * 80}, ${200 + Math.random() * 55}, ${150 + Math.random() * 105}, `,
    life: 1.0,
    decay: 0.001 + Math.random() * 0.004
  }
}

// 更新粒子
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx
    p.y += p.vy
    p.life -= p.decay

    if (p.x < 0 || p.x > canvasWidth || p.y < 0 || p.y > canvasHeight || p.life <= 0) {
      particles[i] = createParticle()
    }
  }
}

// 绘制粒子（无星空）
function drawParticles() {
  for (let p of particles) {
    ctx.fillStyle = p.color + p.life * 0.8 + ')'
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2)
    ctx.fill()
  }
}

// 动画循环
function animate() {
  // 清除画布（透明背景）
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 更新并绘制粒子
  updateParticles()
  drawParticles()

  animationId = requestAnimationFrame(animate)
}

// 设置 canvas 尺寸（考虑设备像素比）
function resizeCanvas() {
  if (!waveCanvas.value) return
  const canvas = waveCanvas.value
  const container = canvas.parentElement
  const dpr = window.devicePixelRatio || 1

  canvasWidth = container.clientWidth
  canvasHeight = container.clientHeight

  canvas.width = canvasWidth * dpr
  canvas.height = canvasHeight * dpr
  canvas.style.width = canvasWidth + 'px'
  canvas.style.height = canvasHeight + 'px'

  ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // 重置粒子（适应新尺寸）
  particles = []
  initParticles(MAX_PARTICLES)
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  animate()
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<style scoped>
/* 应用到标题 */
.title-chinese {
  font-family: 'jijia', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  /* 其他样式保持不变 */
}
/* 样式部分与之前完全相同，但修改了边框和发光效果 */
.screen-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 80px;
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(10, 25, 20, 0.7);
  backdrop-filter: blur(10px);
  /* border-bottom: 1px solid rgba(100, 255, 180, 0.3); */ /* 已移除边框线条 */
  box-shadow: 0 4px 30px rgba(80, 255, 150, 0.15);
  z-index: 10;
  color: #fff;
  font-family: 'PingFang SC', 'Microsoft YaHei', '苹方', sans-serif;
  overflow: hidden;
}

/* CSS 波纹背景容器 */
.wave-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* 单个波纹元素 */
.wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  margin-left: -100px;
  margin-top: -100px;
  border-radius: 50%;
  border: 2px solid rgba(100, 255, 180, 0.3);
  box-shadow: 0 0 20px rgba(80, 255, 150, 0.3);
  transform: scale(0);
  opacity: 0;
  animation: waveExpand 8s infinite ease-out;
}

.wave:nth-child(2) {
  animation-delay: 2s;
  width: 250px;
  height: 250px;
  margin-left: -125px;
  margin-top: -125px;
  border-color: rgba(120, 255, 200, 0.25);
}

.wave:nth-child(3) {
  animation-delay: 4s;
  width: 300px;
  height: 300px;
  margin-left: -150px;
  margin-top: -150px;
  border-color: rgba(140, 255, 220, 0.2);
}

.wave:nth-child(4) {
  animation-delay: 6s;
  width: 350px;
  height: 350px;
  margin-left: -175px;
  margin-top: -175px;
  border-color: rgba(160, 255, 240, 0.15);
}

@keyframes waveExpand {
  0% {
    transform: scale(0);
    opacity: 0.8;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    transform: scale(3);
    opacity: 0;
  }
}

/* Canvas 粒子层 */
.wave-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.header-left {
  width: 200px;
  position: relative;
  z-index: 2;
}

.header-title {
  position: relative;
  text-align: center;
  z-index: 2;
}

/* 发光短线条动画 */
.header-title::after {
  content: '';
  position: absolute;
  bottom: -15px;          /* 位于标题下方 */
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #a0ffc0, transparent);
  box-shadow: 0 0 15px #80ffa0;
  animation: glowLine 7s infinite ease-out;
}

@keyframes glowLine {
  0% {
    width: 0;
    opacity: 1;
  }
  50% {
    width: 195%;           /* 扩展到父容器宽度的30% */
    opacity: 0.8;
  }
  100% {
    width: 0;
    opacity: 0;
  }
}

.title-chinese {
  display: block;
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #b0ffc0, #70e090, #40c060);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  letter-spacing: 4px;
  /* 减弱文字发光效果 */
  text-shadow: 0 0 10px rgba(100, 255, 150, 0.3);
  -webkit-text-stroke: 1px rgba(255, 255, 255, 0.2);
  font-family: 'PingFang SC', 'Microsoft YaHei', '华文楷体', 'KaiTi', cursive;
  transform: scale(1.02);
  transition: all 0.3s ease;
}

.title-chinese:hover {
  text-shadow: 0 0 20px #90ffb0;  /* 悬停时可稍强，但仍保持减弱 */
  transform: scale(1.05);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 30px;
  width: 200px;
  justify-content: flex-end;
  position: relative;
  z-index: 2;
}

.time-display {
  text-align: right;
}

.time-label {
  font-size: 12px;
  color: #b0e0c0;
  letter-spacing: 1px;
  margin-bottom: 4px;
  text-transform: uppercase;
  opacity: 0.8;
}

.time-value {
  font-family: 'Quicksand', 'DIN', monospace;
  font-size: 16px;
  font-weight: 500;
  color: #a0ffc0;
  text-shadow: 0 0 8px #40e080;
}

.exit-btn {
  background: rgba(32, 80, 50, 0.6);
  border: 1px solid rgba(100, 255, 180, 0.4);
  color: #d0ffd0;
  border-radius: 30px;
  padding: 8px 18px;
  transition: all 0.3s ease;
  font-weight: 500;
  backdrop-filter: blur(5px);
  box-shadow: 0 0 15px rgba(64, 224, 128, 0.3);
}

.exit-btn:hover {
  background: rgba(64, 224, 128, 0.25);
  border-color: #80ffa0;
  color: #ffffff;
  box-shadow: 0 0 25px #80ffa0;
  transform: scale(1.05);
}

.exit-btn:active {
  transform: scale(0.98);
}

.exit-btn :deep(.el-icon) {
  margin-right: 6px;
  filter: drop-shadow(0 0 5px currentColor);
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .screen-header {
    padding: 0 20px;
  }
  .title-chinese {
    font-size: 28px;
    letter-spacing: 2px;
  }
  .header-left, .header-right {
    width: 150px;
  }
}
</style>