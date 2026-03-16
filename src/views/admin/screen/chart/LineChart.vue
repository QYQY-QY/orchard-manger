<template>
  <div class="price-chart-container">
    <!-- 品种按钮组 - 移除了标题 -->
    <div class="fruit-buttons-wrapper">
      <button class="scroll-btn left" @click="scrollButtons('left')" :disabled="!canScrollLeft">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2" />
        </svg>
      </button>
      <div class="fruit-buttons-container" ref="buttonsContainerRef">
        <div class="fruit-buttons" :style="{ transform: `translateX(${scrollOffset}px)` }">
          <button v-for="fruit in fruitOptions" :key="fruit" :class="['fruit-btn', { active: selectedFruit === fruit }]"
            @click="handleFruitSelect(fruit)">
            {{ fruit }}
          </button>
        </div>
      </div>
      <button class="scroll-btn right" @click="scrollButtons('right')" :disabled="!canScrollRight">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" />
        </svg>
      </button>
    </div>
    <!-- 图表容器 - 现在可以自由伸展 -->
    <div ref="chartRef" class="chart" :style="{ height }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'
import { useUserStore } from '@/stores/modules/user'

const props = defineProps({
  height: { type: String, default: '200px' }
})

const chartRef = ref(null)
const buttonsContainerRef = ref(null)
let chart = null
let resizeObserver = null
const userStore = useUserStore()

// 所有浙江品种的果实选项
const fruitOptions = ref([])

// 选中的品种
const selectedFruit = ref('')

// 价格数据
const priceData = ref([])

// 滚动相关
const scrollOffset = ref(0)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const buttonWidth = 70 // 每个按钮的估算宽度（px）

// 获取所有价格数据并提取浙江品种
const fetchAllPriceData = async () => {
  try {
    const response = await axios.get('/api/api/price/all')
    const res = response.data

    if (res.code === 200 && Array.isArray(res.data)) {
      // 筛选浙江地区的所有品种（去重）
      const zhejiangFruits = [...new Set(
        res.data
          .filter(item =>
            item.origin &&
            item.origin.includes('浙江') &&
            item.fruitName // 确保有品种名称
          )
          .map(item => item.fruitName)
      )].sort() // 按字母排序

      if (zhejiangFruits.length > 0) {
        fruitOptions.value = zhejiangFruits
        // 默认选择第一个品种
        if (!selectedFruit.value) {
          selectedFruit.value = zhejiangFruits[0]
        }
      } else {
        console.warn('未找到浙江地区的品种数据')
        fruitOptions.value = []
      }

      // 如果有选中的品种，获取其价格数据
      if (selectedFruit.value) {
        await fetchPriceData(selectedFruit.value, res.data)
      }
    }
  } catch (error) {
    console.error('获取价格数据失败', error)
  }
}

// 获取指定品种的价格数据
const fetchPriceData = async (fruitName, allData = null) => {
  if (!fruitName) return

  try {
    let data = allData
    if (!data) {
      const response = await axios.get('/api/api/price/all')
      data = response.data.data
    }

    if (Array.isArray(data)) {
      // 筛选浙江地区、指定品种的数据，并按日期排序
      const filteredData = data
        .filter(item =>
          item.fruitName === fruitName &&
          item.origin &&
          item.origin.includes('浙江')
        )
        .sort((a, b) => new Date(a.priceDate) - new Date(b.priceDate))
        .map(item => ({
          date: item.priceDate,
          price: item.price,
          unit: item.unit,
          market: item.market || '浙江农产品批发市场'
        }))

      priceData.value = filteredData
      updateChart(filteredData)
    }
  } catch (error) {
    console.error('获取价格数据失败', error)
    priceData.value = []
    updateChart([])
  }
}

// 更新图表
const updateChart = (data) => {
  if (!chart) return

  if (!data || data.length === 0) {
    chart.setOption({
      title: {
        text: '暂无该品种的浙江地区价格数据',
        textStyle: {
          color: '#95b8a5',
          fontSize: 14,
          fontWeight: 'normal'
        },
        left: 'center',
        top: 'center'
      },
      series: []
    })
    return
  }

  // 计算价格范围用于y轴
  const prices = data.map(item => item.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice
  const yMin = Math.max(0, Math.floor((minPrice - priceRange * 0.1) * 10) / 10)
  const yMax = Math.ceil((maxPrice + priceRange * 0.1) * 10) / 10

  const option = {
    // 提示框 - 移除了产地显示
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        const item = data[params[0].dataIndex]
        return `
          <div style="color: #4a7a6c; font-weight: bold;">${item.date}</div>
          <div style="color: #6b9e8a;">价格: ${item.price} 元/${item.unit}</div>
          <div style="color: #8bb8a5;">市场: ${item.market}</div>
        `
      },
      backgroundColor: 'rgba(240, 250, 240, 0.95)',
      borderColor: '#a8d5ba',
      borderWidth: 1,
      textStyle: {
        color: '#2c4a3a',
        fontSize: 12
      },
      axisPointer: {
        lineStyle: {
          color: '#a8d5ba',
          width: 1
        }
      }
    },
    // 网格配置 - 优化间距让图表自由伸展
    grid: {
      left: '6%',
      right: '4%',
      top: '12%',
      bottom: '10%',
      containLabel: true,
      backgroundColor: 'rgba(240, 250, 240, 0.1)',
      borderColor: '#c0e0d0',
      borderWidth: 1
    },
    // x轴
    xAxis: {
      type: 'category',
      data: data.map(item => item.date),
      axisLabel: {
        color: '#6b9e8a',
        fontSize: 11,
        rotate: data.length > 10 ? 35 : 0,
        margin: 8,
        interval: 'auto', // 自动调整标签间隔
        hideOverlap: true // 隐藏重叠标签
      },
      axisLine: {
        lineStyle: {
          color: '#a8d5ba',
          width: 1
        }
      },
      axisTick: {
        lineStyle: {
          color: '#a8d5ba'
        }
      },
      splitLine: {
        show: false
      }
    },
    // y轴
    yAxis: {
      type: 'value',
      name: '价格 (元/斤)',
      nameTextStyle: {
        color: '#4a7a6c',
        fontSize: 12,
        fontWeight: 'normal'
      },
      axisLabel: {
        color: '#6b9e8a',
        fontSize: 11
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#a8d5ba'
        }
      },
      axisTick: {
        lineStyle: {
          color: '#a8d5ba'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#d0e8da',
          type: 'dashed',
          width: 0.5
        }
      },
      min: yMin,
      max: yMax
    },
    // 数据系列
    series: [
      {
        name: '价格',
        type: 'line',
        data: data.map(item => item.price),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: true,
        // 线条样式
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#7bc5a0' },
            { offset: 0.5, color: '#4a9e7a' },
            { offset: 1, color: '#2d7a5a' }
          ]),
          shadowColor: 'rgba(75, 150, 110, 0.3)',
          shadowBlur: 10,
          shadowOffsetY: 2
        },
        // 区域填充
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(123, 197, 160, 0.3)' },
            { offset: 1, color: 'rgba(210, 235, 215, 0.1)' }
          ])
        },
        // 标记点样式
        itemStyle: {
          color: '#ffffff',
          borderColor: '#4a9e7a',
          borderWidth: 2,
          shadowColor: 'rgba(75, 150, 110, 0.3)',
          shadowBlur: 8
        },
        // 高亮效果
        emphasis: {
          focus: 'series',
          lineStyle: {
            width: 4,
            shadowBlur: 15
          },
          itemStyle: {
            borderColor: '#7bc5a0',
            borderWidth: 3,
            shadowBlur: 12
          }
        }
      }
    ],
    // 数据缩放（数据多时使用）
    dataZoom: data.length > 12 ? [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        show: true,
        type: 'slider',
        start: 0,
        end: 100,
        backgroundColor: 'rgba(210, 235, 215, 0.3)',
        fillerColor: 'rgba(123, 197, 160, 0.3)',
        borderColor: '#a8d5ba',
        textStyle: {
          color: '#4a7a6c'
        },
        height: 20,
        bottom: 5
      }
    ] : [],
    // 背景色
    backgroundColor: 'transparent'
  }

  chart.setOption(option)
}

// 处理品种选择
const handleFruitSelect = (fruit) => {
  selectedFruit.value = fruit
  fetchPriceData(fruit)
}

// 滚动按钮
const scrollButtons = (direction) => {
  if (!buttonsContainerRef.value) return

  const container = buttonsContainerRef.value
  const scrollAmount = 150 // 每次滚动的像素

  if (direction === 'left') {
    scrollOffset.value = Math.min(scrollOffset.value + scrollAmount, 0)
  } else {
    const maxScroll = -(fruitOptions.value.length * buttonWidth - container.clientWidth)
    scrollOffset.value = Math.max(scrollOffset.value - scrollAmount, maxScroll)
  }

  updateScrollButtons()
}

// 更新滚动按钮状态
const updateScrollButtons = () => {
  if (!buttonsContainerRef.value) return

  const container = buttonsContainerRef.value
  const totalWidth = fruitOptions.value.length * buttonWidth
  const containerWidth = container.clientWidth

  canScrollLeft.value = scrollOffset.value < 0
  canScrollRight.value = totalWidth > containerWidth && scrollOffset.value > -(totalWidth - containerWidth)
}

// 监听容器大小变化
const observeContainerSize = () => {
  if (!buttonsContainerRef.value) return

  resizeObserver = new ResizeObserver(() => {
    updateScrollButtons()
  })

  resizeObserver.observe(buttonsContainerRef.value)
}

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
}

// 监听选中品种变化
watch(() => selectedFruit.value, (newVal) => {
  if (newVal) {
    fetchPriceData(newVal)
  }
})

// 监听fruitOptions变化，更新滚动按钮状态
watch(() => fruitOptions.value.length, () => {
  nextTick(() => {
    updateScrollButtons()
  })
})

// 窗口大小变化响应
onMounted(async () => {
  initChart()
  await fetchAllPriceData()

  // 添加窗口大小变化监听
  window.addEventListener('resize', () => {
    chart?.resize()
    updateScrollButtons()
  })

  // 观察容器大小变化
  observeContainerSize()

  // 等待DOM更新后计算滚动按钮状态
  await nextTick()
  updateScrollButtons()
})

onUnmounted(() => {
  chart?.dispose()
  window.removeEventListener('resize', () => chart?.resize())
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<style scoped>
.price-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* 品种按钮包装器 - 移除了标题相关样式 */
.fruit-buttons-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 15px 0 15px;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}

/* 按钮容器 */
.fruit-buttons-container {
  overflow: hidden;
  flex: 1;
  position: relative;
  min-width: 0;
  /* 防止flex溢出 */
}

.fruit-buttons {
  display: flex;
  gap: 6px;
  transition: transform 0.3s ease;
  white-space: nowrap;
  will-change: transform;
}

/* 滚动按钮 */
.scroll-btn {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: rgba(123, 197, 160, 0.1);
  border: 1px solid #7bc5a0;
  color: #7bc5a0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
  padding: 0;
}

.scroll-btn:hover:not(:disabled) {
  background: rgba(123, 197, 160, 0.3);
  transform: scale(1.1);
}

.scroll-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  border-color: #4a7a6c;
  color: #4a7a6c;
}

.scroll-btn svg {
  width: 16px;
  height: 16px;
}

/* 品种按钮 */
.fruit-btn {
  padding: 4px 12px;
  background: rgba(123, 197, 160, 0.1);
  border: 1px solid #7bc5a0;
  border-radius: 16px;
  color: #a0d0a0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  flex-shrink: 0;
}

.fruit-btn:hover {
  background: rgba(123, 197, 160, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(123, 197, 160, 0.3);
  color: #d0ffd0;
}

.fruit-btn.active {
  background: linear-gradient(135deg, #7bc5a0, #2d7a5a);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(45, 122, 90, 0.4);
  font-weight: 500;
}

/* 图表容器 - 现在可以自由伸展 */
.chart {
  width: 100%;
  flex: 1;
  min-height: 0;
  transition: all 0.3s ease;
}

/* 悬停效果 */
.chart:hover {
  filter: drop-shadow(0 4px 12px rgba(123, 197, 160, 0.2));
}

/* 响应式调整 */
@media (max-width: 768px) {
  .fruit-buttons-wrapper {
    padding: 6px 10px 0 10px;
  }

  .fruit-btn {
    padding: 3px 10px;
    font-size: 12px;
  }
}
</style>