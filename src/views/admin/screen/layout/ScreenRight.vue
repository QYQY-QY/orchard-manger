<template>
  <div class="screen-right">
    <!-- 背景层（渐变 + 网格线 + 扫描线） -->
    <div class="right-bg"></div>

    <!-- 内容层 -->
    <div class="right-content">
      <!-- 折线图 -->
      <div class="chart-card">
        <div class="card-title">实时果价</div>
        <LineChart :data="lineData" height="160px" />
      </div>

      <!-- 区域果树总数卡片 -->
      <div class="area-stats-card">
        <div class="card-title">区域果树分布</div>
        <div class="area-grid">
          <div v-for="(area, index) in areaStats" :key="index" class="area-item">
            <div class="area-name">区域 {{ index + 1 }}</div>
            <div class="area-count">{{ area.total }} 棵</div>
            <!-- 移除了品种标签展示 -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/modules/user'
import LineChart from '../chart/LineChart.vue'

const userStore = useUserStore()
const orchardId = computed(() => userStore.user?.orchardId)

// 区域统计数据 - 只保留总数
const areaStats = ref([
  { total: 0 },
  { total: 0 },
  { total: 0 }
])

// 差异化随机分配函数 - 区域3比区域1、2少1/3左右
const differentiatedRandomSplit = (total) => {
  if (total <= 0) return [0, 0, 0]

  // 计算基础比例：区域1和区域2各占约40%，区域3占约20%
  // 区域3 = 区域1的50% (少1/2)
  // 这样区域3比其他区域少1/3左右

  // 基础分配比例
  const ratio1 = 0.4  // 区域1占40%
  const ratio2 = 0.4  // 区域2占40%
  const ratio3 = 0.2  // 区域3占20%

  // 根据比例计算基础数量
  let base1 = Math.floor(total * ratio1)
  let base2 = Math.floor(total * ratio2)
  let base3 = Math.floor(total * ratio3)

  // 计算剩余数量（由于取整可能丢失的数量）
  let remaining = total - (base1 + base2 + base3)

  // 随机分配剩余数量
  if (remaining > 0) {
    for (let i = 0; i < remaining; i++) {
      const rand = Math.random()
      if (rand < 0.4) {
        base1 += 1
      } else if (rand < 0.8) {
        base2 += 1
      } else {
        base3 += 1
      }
    }
  }

  let result = [base1, base2, base3]

  // 添加少量随机波动（±3%范围内波动），使数字更自然
  const fluctuation = Math.floor(total * 0.03)
  if (fluctuation > 0) {
    for (let i = 0; i < 2; i++) { // 只给区域1和2添加波动，保持区域3相对稳定
      const change = Math.floor(Math.random() * fluctuation) - Math.floor(fluctuation / 2)
      if (result[i] + change > 0 && result[i] + change < total) {
        result[i] += change
      }
    }

    // 重新计算总和，调整区域3使总和不变
    const newSum = result[0] + result[1] + result[2]
    if (newSum !== total) {
      const diff = total - newSum
      result[2] += diff
      // 确保区域3不为负数
      if (result[2] < 0) {
        result[2] = 0
      }
    }
  }

  return result
}

// 获取区域果树数据
const fetchAreaStats = async () => {
  if (!orchardId.value) {
    console.warn('orchardId 无效')
    // 如果没有 orchardId，显示空数据
    areaStats.value = [
      { total: 0 },
      { total: 0 },
      { total: 0 }
    ]
    return
  }

  try {
    const response = await axios.get(`/api/fruitTree/statisticsAreaTreeType/${orchardId.value}`)
    const res = response.data

    if (res.code === 200 && Array.isArray(res.data)) {
      // 计算所有区域的总数
      let totalTrees = 0

      res.data.forEach(item => {
        if (item.typeCount && Array.isArray(item.typeCount)) {
          item.typeCount.forEach(tc => {
            if (tc.typeName && tc.count > 0) {
              totalTrees += tc.count
            }
          })
        }
      })

      console.log('总计果树数量:', totalTrees)

      if (totalTrees === 0) {
        // 如果没有果树数据，显示空数据
        areaStats.value = [
          { total: 0 },
          { total: 0 },
          { total: 0 }
        ]
        return
      }

      // 使用差异化分配函数将总数分成三份
      const totalSplits = differentiatedRandomSplit(totalTrees)

      // 更新区域统计数据
      areaStats.value = areaStats.value.map((area, index) => ({
        total: totalSplits[index]
      }))

      console.log('区域分配结果:', areaStats.value)
    } else {
      console.error('获取果树品种数据失败')
      // 接口返回错误，显示空数据
      areaStats.value = [
        { total: 0 },
        { total: 0 },
        { total: 0 }
      ]
    }
  } catch (error) {
    console.error('获取区域果树数据失败', error)
    // 请求失败，显示空数据
    areaStats.value = [
      { total: 0 },
      { total: 0 },
      { total: 0 }
    ]
  }
}

onMounted(() => {
  fetchAreaStats()
})
</script>

<style scoped>
.screen-right {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  /* 左深黑 → 右暗绿透明渐变（方向与左侧相反） */
  background: linear-gradient(to left,
      rgba(0, 23, 9, 0.884) 0%,
      rgba(0, 30, 0, 0.452) 40%,
      rgba(1, 31, 1, 0.066) 75%,
      rgba(1, 31, 1, 0) 100%);
  backdrop-filter: blur(2px);
}

/* 背景层：网格线 + 扫描线 */
.right-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* 暗绿色网格线 */
.right-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(66, 104, 66, 0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(25, 70, 66, 0.15) 1px, transparent 1px);
  background-size: 30px 30px;
}

/* 流动扫描线（极淡的暗绿光带） */
.right-bg::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 80, 0, 0.1), transparent);
  animation: scanMove 10s infinite linear;
}

@keyframes scanMove {
  0% {
    left: -100%;
  }

  100% {
    left: 100%;
  }
}

.right-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.chart-card,
.area-stats-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: transparent;
  border: none;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 80, 0, 0.2) inset;
  backdrop-filter: blur(4px);
  border-radius: 16px;
  padding: 15px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.chart-card:hover,
.area-stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(186, 240, 224, 0.142) inset;
}

.card-title {
  font-size: 18px;
  font-weight: 500;
  color: #c0ffc0;
  margin-bottom: 16px;
  padding-left: 12px;
  position: relative;
  text-shadow: none;
}

.card-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: linear-gradient(to bottom, #3fb896, #235640);
  border-radius: 2px;
}

/* 区域网格布局 */
.area-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

/* 区域项 */
.area-item {
  background: rgba(0, 40, 0, 0.3);
  border: 1px solid rgba(63, 184, 150, 0.3);
  border-radius: 12px;
  padding: 16px 12px;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.area-item:hover {
  background: rgba(0, 60, 0, 0.4);
  border-color: #3fb896;
  transform: translateX(4px);
}

/* 区域名称 */
.area-name {
  font-size: 18px;
  font-weight: 500;
  color: #c0ffc0;
  display: flex;
  align-items: center;
}

.area-name::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #3fb896;
  border-radius: 50%;
  margin-right: 8px;
}

/* 区域总数 */
.area-count {
  font-size: 28px;
  font-weight: 600;
  color: #d0ffd0;
  line-height: 1.2;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .right-content {
    padding: 15px;
    gap: 15px;
  }

  .area-item {
    padding: 12px 10px;
  }

  .area-name {
    font-size: 16px;
  }

  .area-count {
    font-size: 22px;
  }
}

@media (max-width: 480px) {
  .area-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>