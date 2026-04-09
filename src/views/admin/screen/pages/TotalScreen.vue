<!-- TotalScreen.vue - 山地果园AI单株精准管理 · 六子大屏总览 -->
<template>
  <div class="dashboard-wrap">
    <!-- 返回按钮 - 移到右侧 -->
    <div class="back-button" @click="goBack">
      <i class="fas fa-arrow-left"></i> 返回地图
    </div>

    <h1>
      <i class="fas fa-tree" style="color: #256b43;"></i>
        单株精准智能决策平台
      <span class="region-badge" :style="{ backgroundColor: regionColor }">
        {{ regionName }}
      </span>
    </h1>

    <!-- 六个大屏网格 -->
    <div class="grid-6">
      <!-- 大屏1 宏观监控总览 -->
      <div class="subscreen" @click="navigateToScreen('Overview')">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-globe-asia"></i> 果园宏观监控总览</div>
        </div>
        <div class="card-body">
          <table class="spec-table">
            <tr>
              <td class="cat-col">核心KPI</td>
              <td class="data-col">
                <span class="kpi-number-lg">{{ formatNumber(regionData.totalTrees) }}</span><span class="unit">总株</span>
                <span style="margin-left: 12px;"><i class="fas fa-check-circle" style="color:#259456;"></i> 覆盖率{{
                  regionData.coverage }}%</span>
                <br>
                <span class="kpi-badge">健康株占比 {{ regionData.healthRate }}%</span>
                <span class="kpi-badge">异常株 {{ regionData.abnormalTrees }}</span>
                <span class="kpi-badge">周均异常率 {{ regionData.weeklyAbnormalRate }}% <i
                    class="fas fa-arrow-down trend-up"></i></span>
              </td>
            </tr>
            <tr>
              <td class="cat-col">全园健康度可视化</td>
              <td class="data-col">
                <div class="mock-map-sm">
                  <div class="map-overlay">
                    <span>NDVI {{ regionData.ndvi }}</span>
                    <span>🌿旺盛区 {{ regionData.vigorRate }}%</span>
                    <span>⚠️低值区 {{ regionData.lowRate }}%</span>
                  </div>
                </div>
                热力图·地块钻取
              </td>
            </tr>
            <tr>
              <td class="cat-col">实时预警</td>
              <td class="data-col">
                <div class="warn-flash">
                  <span class="dot-red"></span> 高危预警株: {{ regionData.highRisk }} (黄龙病疑似) · 红蜘蛛爆发区 {{
                    regionData.spiderOutbreak }}个
                  <span style="background:#f0b27a; border-radius:20px; padding:2px 8px;">待处理{{ regionData.pending
                    }}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td class="cat-col">核心农事概览</td>
              <td class="data-col">
                <div class="flex-between"><span>灌溉完成</span><span>{{ regionData.irrigationProgress }}%</span></div>
                <div class="progress">
                  <div class="progress-fill" :style="{ width: regionData.irrigationProgress + '%' }"></div>
                </div>
                <div class="flex-between"><span>防控进度</span><span>{{ regionData.controlProgress }}%</span></div>
                <div class="progress">
                  <div class="progress-fill" :style="{ width: regionData.controlProgress + '%' }"></div>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- 大屏2 水肥精准管控决策 -->
      <div class="subscreen" @click="navigateToScreen('WaterFertilizer')">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-tint"></i> 水肥精准管控决策</div>
        </div>
        <div class="card-body">
          <table class="spec-table">
            <tr>
              <td class="cat-col">植被指数均值</td>
              <td class="data-col">
                <span class="vi-badge">NDVI {{ viStats.ndvi.mean.toFixed(2) }}</span>
                <span class="vi-badge">NDRE {{ viStats.ndre.mean.toFixed(2) }}</span>
                <span class="vi-badge">OSAVI {{ viStats.osavi.mean.toFixed(2) }}</span>
                <span class="vi-badge">NDWI {{ viStats.ndwi.mean.toFixed(2) }}</span>
              </td>
            </tr>
            <tr>
              <td class="cat-col">水肥缺失诊断</td>
              <td class="data-col">
                <span class="deficit-badge n">缺氮 {{ nutrientCounts.n }}株</span>
                <span class="deficit-badge p">缺磷 {{ nutrientCounts.p }}株</span>
                <span class="deficit-badge k">缺钾 {{ nutrientCounts.k }}株</span>
                <span class="deficit-badge water">缺水 {{ nutrientCounts.water }}株</span>
                <span class="deficit-badge other">其他 {{ nutrientCounts.other }}株</span>
              </td>
            </tr>
            <tr>
              <td class="cat-col">精准施肥建议</td>
              <td class="data-col">
                {{ regionData.fertilizer.recommendation }}
                <div style="margin-top:4px; font-size:0.75rem; color:#497a5a;">
                  基于多光谱反演 NDVI={{ viStats.ndvi.mean.toFixed(2) }}
                </div>
              </td>
            </tr>
            <tr>
              <td class="cat-col">养分趋势分析</td>
              <td class="data-col">
                {{ regionData.fertilizer.trend }}
                <div style="margin-top:4px; font-size:0.75rem;">
                  NDVI范围: {{ viStats.ndvi.min.toFixed(2) }} ~ {{ viStats.ndvi.max.toFixed(2) }}
                </div>
              </td>
            </tr>
            <tr>
              <td class="cat-col">水肥成本统计</td>
              <td class="data-col">
                {{ regionData.fertilizer.costSaving }}
              </td>
            </tr>
          </table>
          <div
            style="margin-top:8px; background:#e6f3ea; border-radius:16px; padding:8px; text-align:center; font-size:0.75rem;">
            <i class="fas fa-satellite"></i> 基于989个多光谱采样点 · 反演精度94%
          </div>
        </div>
      </div>

      <!-- 大屏3 病虫害专项防控 -->
      <div class="subscreen" @click="navigateToScreen('PestControl')">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-bug"></i> 病虫害专项防控</div>
        </div>
        <div class="card-body">
          <table class="spec-table">
            <tr>
              <td class="cat-col">病虫害实时监测</td>
              <td class="data-col">
                <span class="kpi-badge">红蜘蛛 {{ regionData.pest.spiderMite }}株</span>
                <span class="kpi-badge">黄龙病 {{ regionData.pest.huanglongbing }}株</span>
                <span class="kpi-badge">炭疽病 {{ regionData.pest.anthracnose }}株</span>
                诱捕器峰值 {{ regionData.pest.trapPeak }}头/日
              </td>
            </tr>
            <tr>
              <td class="cat-col">预警分布热力</td>
              <td class="data-col">
                <div class="mock-map-sm" style="background:#f5d0bb;">
                  <div class="map-overlay">{{ regionData.pest.warningArea }}</div>
                </div>
                {{ regionData.pest.disasterArea }}个重灾地块
              </td>
            </tr>
            <tr>
              <td class="cat-col">防治任务</td>
              <td class="data-col">
                今日派发{{ regionData.pest.tasks.issued }}单 · 完成{{ regionData.pest.tasks.completed }}单 · 剩余{{
                  regionData.pest.tasks.remaining }}单
                <br>
                <div class="progress">
                  <div class="progress-fill" :style="{ width: regionData.pest.tasks.completionRate + '%' }"></div>
                </div>
                防控覆盖率 {{ regionData.pest.controlCoverage }}%
              </td>
            </tr>
            <tr>
              <td class="cat-col">药剂使用分析</td>
              <td class="data-col">{{ regionData.pest.pesticideUsage }}</td>
            </tr>
            <tr>
              <td class="cat-col">防治效果反馈</td>
              <td class="data-col">{{ regionData.pest.controlEffect }}</td>
            </tr>
          </table>
          <div style="margin-top:12px; background:#f0f6ec; border-radius:16px; padding:10px;">
            <i class="fas fa-clipboard-list"></i> {{ regionData.pest.tomorrowWarning }}
          </div>
        </div>
      </div>

      <!-- 大屏4 农事任务调度管理 -->
      <div class="subscreen" @click="navigateToScreen('TaskDispatch')">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-tasks"></i> 农事任务调度管理</div>
        </div>
        <div class="card-body">
          <table class="spec-table">
            <tr>
              <td class="cat-col">任务总览</td>
              <td class="data-col">
                <span class="kpi-number-lg">{{ regionData.task.totalPending }}</span>待派发 /
                <span class="kpi-number-lg">{{ regionData.task.totalWaiting }}</span>待执行 / 完成{{
                  regionData.task.totalCompleted }}
                <span class="trend-up">完成率{{ regionData.task.completionRate }}%</span> 逾期{{ regionData.task.overdue }}
              </td>
            </tr>
            <tr>
              <td class="cat-col">任务分布统计</td>
              <td class="data-col">
                {{ regionData.task.distribution }} · 热力图地块
              </td>
            </tr>
            <tr>
              <td class="cat-col">人员绩效排行</td>
              <td class="data-col">
                {{ regionData.task.performanceRank }}
              </td>
            </tr>
            <tr>
              <td class="cat-col">任务执行进度</td>
              <td class="data-col">
                <div class="mock-map-sm" style="height:40px;">
                  <div class="map-overlay">⚡{{ regionData.task.currentExecution }}</div>
                </div>
                反馈照片 {{ regionData.task.feedbackPhotos }}张
              </td>
            </tr>
            <tr>
              <td class="cat-col">逾期任务预警</td>
              <td class="data-col">
                <span class="dot-red"></span> {{ regionData.task.overdueWarning }}
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- 大屏5 植被指数趋势分析 -->
      <div class="subscreen" @click="navigateToScreen('HistoricalTrend')">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-chart-line"></i> 植被指数趋势分析</div>
        </div>
        <div class="card-body">
          <table class="spec-table">
            <tr>
              <td class="cat-col">NDVI统计</td>
              <td class="data-col">
                均值 {{ viStats.ndvi.mean.toFixed(2) }} | 中位数 {{ viStats.ndvi.median.toFixed(2) }} | 标准差 {{
                  viStats.ndvi.std.toFixed(2) }}
              </td>
            </tr>
            <tr>
              <td class="cat-col">NDRE统计</td>
              <td class="data-col">
                均值 {{ viStats.ndre.mean.toFixed(2) }} | 中位数 {{ viStats.ndre.median.toFixed(2) }} | 范围 [{{
                  viStats.ndre.min.toFixed(2) }}, {{ viStats.ndre.max.toFixed(2) }}]
              </td>
            </tr>
            <tr>
              <td class="cat-col">健康株占比趋势</td>
              <td class="data-col">
                <div class="flex-between"></div>
                <div class="progress">
                  <div class="progress-fill" :style="{ width: regionData.history.healthTrend.thisYearValue + '%' }">
                  </div>
                </div>
                预测 {{ regionData.history.healthTrend.prediction }}
              </td>
            </tr>
            <tr>
              <td class="cat-col">植被指数相关性</td>
              <td class="data-col">
                <span class="corr-tag">NDVI-NDRE r=0.76</span>
                <span class="corr-tag">NDVI-OSAVI r=0.92</span>
                <span class="corr-tag">NDVI-NDWI r=-0.43</span>
              </td>
            </tr>
            <!-- <tr>
              <td class="cat-col">年度对比</td>
              <td class="data-col">
                {{ regionData.history.yearlyComparison }}
              </td>
            </tr> -->
          </table>
        </div>
      </div>

      <!-- 大屏6 多端协同与溯源管理 -->
      <div class="subscreen" @click="navigateToScreen('MultiCooperation')">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-handshake"></i> 多端协同&溯源</div>
        </div>
        <div class="card-body">
          <table class="spec-table">
            <tr>
              <td class="cat-col">多端访问统计</td>
              <td class="data-col">
                {{ regionData.collaboration.accessStats }}
              </td>
            </tr>
            <tr>
              <td class="cat-col">溯源数据概览</td>
              <td class="data-col">
                <span class="kpi-number-lg">{{ regionData.collaboration.traceCodes }}</span> 溯源码生成 · 扫码查询 {{
                  regionData.collaboration.scanCount }} · 完整率{{ regionData.collaboration.completeRate }}%
              </td>
            </tr>
            <tr>
              <td class="cat-col">溯源信息展示</td>
              <td class="data-col">
                🍊 {{ regionData.collaboration.traceInfo }}
              </td>
            </tr>
            <tr>
              <td class="cat-col">用户反馈统计</td>
              <td class="data-col">
                {{ regionData.collaboration.feedbackStats }}
              </td>
            </tr>
            <tr>
              <td class="cat-col">数据同步状态</td>
              <td class="data-col">
                <i class="fas fa-circle" style="color:#2ea85c;"></i> {{ regionData.collaboration.syncStatus }}
              </td>
            </tr>
            <tr>
              <td class="cat-col">溯源渠道分析</td>
              <td class="data-col">
                {{ regionData.collaboration.channelAnalysis }}
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <!-- 实施建议卡片（轻量化） -->
    <div
      style="background: #e6f3e6; border-radius: 36px; padding: 28px 32px; margin-top: 36px; border: 1px solid #b1dbbc;">
      <div style="display: flex; gap: 40px; flex-wrap: wrap;">
        <div style="min-width: 200px;">
          <i class="fas fa-desktop" style="color: #1d7845; font-size: 1.8rem;"></i>
          <strong style="font-size:1.2rem;">硬件适配</strong>
          <br>园区门口宏观总览 · 植保办公室病虫害专项
        </div>
        <div>
          <i class="fas fa-lock" style="color:#1d7845; font-size:1.8rem;"></i>
          <strong>权限配置</strong>
          <br>按角色分配大屏查看权限
        </div>
        <div>
          <i class="fas fa-link" style="color:#1d7845; font-size:1.8rem;"></i>
          <strong>数据联动</strong>
          <br>点击异常株钻取至病虫害专项
        </div>
        <div>
          <i class="fas fa-sync-alt" style="color:#1d7845; font-size:1.8rem;"></i>
          <strong>更新频率</strong>
          <br>预警5min · 历史趋势每日
        </div>
      </div>
      <div style="margin-top:24px; border-top:1px dashed #89ba98; padding-top:16px; font-size:0.9rem; color:#386e4b;">
        <i class="fas fa-seedling"></i> 基于989个多光谱采样点 · 数据更新于2026-03-08
      </div>
    </div>

    <!-- 微交互 跨屏联动占位说明 -->
    <div
      style="display: flex; gap: 16px; margin-top: 24px; font-size:0.85rem; background: white; border-radius: 100px; padding: 12px 24px; width: fit-content; border:1px solid #a7cdb2;">
      <span><i class="fas fa-chart-pie"></i> 六屏底层同源 · 多光谱数据</span>
      <span><i class="fas fa-arrow-right"></i> 宏观总览点击异常株可跳转病虫害大屏(示意)</span>
      <span><i class="fas fa-table"></i> 基于真实VI指数统计 · 采样点989个</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

// 从Excel数据中提取的VI指数统计信息
const viStats = {
  ndvi: {
    mean: 0.1583780135885936,
    std: 0.2010034511014434,
    min: -0.5022962093353271,
    q25: 0.02584412135183811,
    median: 0.1657712757587433,
    q75: 0.3072480261325836,
    max: 0.6319974064826965
  },
  ndre: {
    mean: 0.03385013519131006,
    std: 0.0983581813422692,
    min: -0.4191568493843079,
    q25: -0.02025357075035572,
    median: 0.04950086399912834,
    q75: 0.1044447273015976,
    max: 0.2907263934612274
  },
  osavi: {
    mean: 0.1296594866090116,
    std: 0.172654923299496,
    min: -0.504618227481842,
    q25: 0.01543658319860697,
    median: 0.1271517127752304,
    q75: 0.2568859457969666,
    max: 0.5289906859397888
  },
  ndpi: {
    mean: 0.08001737951891237,
    std: 0.08943232205911969,
    min: -0.149915799498558,
    q25: 0.01369945425540209,
    median: 0.06407715380191803,
    q75: 0.1353088915348053,
    max: 0.3617492914199829
  },
  kvi: {
    mean: -0.1583780135885936,
    std: 0.2010034511014434,
    min: -0.6319974064826965,
    q25: -0.3072480261325836,
    median: -0.1657712757587433,
    q75: -0.02584412135183811,
    max: 0.5022962093353271
  },
  cavi: {
    mean: -0.01806225190750164,
    std: 0.05084441546281594,
    min: -0.269679844379425,
    q25: -0.04834622889757156,
    median: -0.01784336566925049,
    q75: 0.01317290961742401,
    max: 0.1270898729562759
  },
  ndwi: {
    mean: -0.100127183598397,
    std: 0.1868036179124288,
    min: -0.623271644115448,
    q25: -0.2220317423343658,
    median: -0.1237816736102104,
    q75: -0.008464551530778408,
    max: 0.610914409160614
  }
}

// 营养状态统计
//这里也要改,数据要统一
const nutrientCounts = {
  n: 46,
  p: 16,
  k: 31,
  water: 19,
  other: 8
}

const totalSamples = 989

// 获取区域参数，默认为'1'
const region = computed(() => route.query.region || '1')

// 区域名称映射
const regionName = computed(() => {
  const names = {
    '1': '汤村',
    '2': '莲村',
    '3': '桂村'
  }
  return names[region.value] || '未知区域'
})

// 区域颜色映射
const regionColor = computed(() => {
  const colors = {
    '1': '#2a6e3f',
    '2': '#33cc66',
    '3': '#779649'
  }
  return colors[region.value] || '#2a6e3f'
})

// 路由映射表
const screenRoutes = {
  'Overview': '/Overview',
  'PestControl': '/PestControl',
  'WaterFertilizer': '/WaterFertilizer',
  'TaskDispatch': '/TaskDispatch',
  'HistoricalTrend': '/HistoricalTrend',
  'MultiCooperation': '/MultiCooperation'
}

// 导航到对应大屏
const navigateToScreen = (screenName) => {
  console.log('导航到:', screenName, '区域:', region.value)

  // 获取对应的路由路径
  const path = screenRoutes[screenName]

  if (path) {
    router.push({
      path: path,
      query: { 
        region: region.value,
        regionName: regionName.value,
        regionId: region.value
      }
    }).catch(err => {
      console.error('路由跳转失败:', err)
      ElMessage.error('页面跳转失败')
    })
  } else {
    console.error('未找到对应的路由:', screenName)
    ElMessage.warning('该功能正在开发中')
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 格式化数字
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 根据区域生成不同的数据
const regionData = computed(() => {
  const baseData = {
    '1': {
      totalTrees: 7747,
      coverage: 98,
      healthRate: 94,
      abnormalTrees: 87,
      weeklyAbnormalRate: 0.7,
      ndvi: viStats.ndvi.mean.toFixed(2),
      vigorRate: 82,
      lowRate: 3,
      highRisk: 23,
      spiderOutbreak: 5,
      pending: 18,
      irrigationProgress: 82,
      controlProgress: 63,
      deviceOnlineRate: 97,
      collectTime: '2026-03-08 10:23',
      pest: {
        spiderMite: 6,
        huanglongbing: 5,
        anthracnose: 3,
        trapPeak: 186,
        warningArea: '地块A2 🔴红蜘蛛 · 地块C5 🟡黄龙病',
        disasterArea: 3,
        tasks: {
          issued: 8,
          completed: 5,
          remaining: 3,
          completionRate: 62.5
        },
        controlCoverage: 91,
        pesticideUsage: '矿物油 32L · 阿维菌素 12L · 苯醚甲环唑 8L',
        controlEffect: '红蜘蛛减退率78% · 黄龙病砍除9株',
        tomorrowWarning: '明日预警: 蚜虫风险中 (地块D3,D7)'
      },
      fertilizer: {
        deficiency: `缺氮 ${nutrientCounts.n}株 · 缺钾 ${nutrientCounts.k}株 · 缺水 ${nutrientCounts.water}株 · 缺磷 ${nutrientCounts.p}株`,
        recommendation: 'A1地块: 高氮水溶肥5kg/亩 (NDVI 0.037) · B7地块: 硫酸钾3.2kg/亩 (KVI -0.301) · C5地块: 滴灌补水30m³ (NDWI -0.081)',
        irrigationProgress: 71,
        pendingBlocks: 'B2,B5',
        trend: `叶片氮含量 2.1% ↓0.2% · NDVI与水肥相关性 r=0.81 · NDVI范围 [${viStats.ndvi.min.toFixed(2)}, ${viStats.ndvi.max.toFixed(2)}]`,
        costSaving: '本月节水 380m³ · 节肥 230kg · 节省成本 ￥4,260'
      },
      task: {
        totalPending: 24,
        totalWaiting: 42,
        totalCompleted: 38,
        completionRate: 68,
        overdue: 7,
        distribution: '灌溉28% 施肥22% 防控18% 修剪20% 采摘12%',
        performanceRank: '1. 王*海 (32任务, 100%) 2. 李*英 (29, 96%) 3. 赵*柱 (27, 93%)',
        currentExecution: '实时作业: 修剪组 @C4',
        feedbackPhotos: 42,
        overdueWarning: '采摘B3逾期2天 · 责任人张*',
        historyTrend: '近7天完成↑12% · 防控效率+8%'
      },
      history: {
        ndviTrend: `2025 Q1 NDVI: ${viStats.ndvi.q25.toFixed(2)} → ${viStats.ndvi.q75.toFixed(2)} (中位数 ${viStats.ndvi.median.toFixed(2)}) · 地块C7增幅最大`,
        healthTrend: {
          lastYear: '2026占比 88%',
          thisYear: '2025 94%',
          thisYearValue: 94,
          prediction: 'Q3 95.5%'
        },
        qualityTrend: '单果重年均+7% · 糖度趋势 12.5→13.2 °Bx',
        abnormalTrend: '3月异常峰值107株 · 4月降至62株 · 红蜘蛛周期减弱',
        yearlyComparison: `NDVI 2025比2026 +0.04 · 健康度提升5% · 采样点 ${totalSamples}个`
      },
      collaboration: {
        accessStats: '微信小程序 46% · APP 28% · PC端 18% · 大屏8% · 活跃用户 187',
        traceCodes: 2340,
        scanCount: 1872,
        completeRate: 96,
        traceInfo: '果品A2-69: 施肥3.18, 检测报告合格 轮播',
        feedbackStats: '反馈23条 · 处理率91% · 满意度4.6',
        syncStatus: '同步成功 10:25 · 日志无异常',
        channelAnalysis: '电商扫码占54% · 批发市场22% · 门店24%  · 地域: 华南为主'
      }
    },
    '2': {
      totalTrees: 10234,
      coverage: 96,
      healthRate: 92,
      abnormalTrees: 76,
      weeklyAbnormalRate: 0.8,
      ndvi: (viStats.ndvi.mean - 0.02).toFixed(2),
      vigorRate: 79,
      lowRate: 4,
      highRisk: 19,
      spiderOutbreak: 4,
      pending: 15,
      irrigationProgress: 78,
      controlProgress: 59,
      deviceOnlineRate: 96,
      collectTime: '2026-03-08 10:23',
      pest: {
        spiderMite: 32,
        huanglongbing: 10,
        anthracnose: 18,
        trapPeak: 168,
        warningArea: '地块B3 🔴红蜘蛛 · 地块B7 🟡黄龙病',
        disasterArea: 2,
        tasks: {
          issued: 7,
          completed: 4,
          remaining: 3,
          completionRate: 57.1
        },
        controlCoverage: 88,
        pesticideUsage: '矿物油 28L · 阿维菌素 10L · 苯醚甲环唑 6L',
        controlEffect: '红蜘蛛减退率72% · 黄龙病砍除7株',
        tomorrowWarning: '明日预警: 蚜虫风险低 (地块B5)'
      },
      fertilizer: {
        deficiency: `缺氮 ${Math.floor(nutrientCounts.n * 0.86)}株 · 缺钾 ${Math.floor(nutrientCounts.k * 0.87)}株 · 缺水 ${Math.floor(nutrientCounts.water * 0.84)}株 · 缺磷 ${Math.floor(nutrientCounts.p * 0.875)}株`,
        recommendation: 'B2地块: 平衡肥4kg/亩 (NDVI 0.158) · 灌溉量22m³ 今日执行',
        irrigationProgress: 68,
        pendingBlocks: 'B4,B6',
        trend: `叶片氮含量 2.0% ↓0.15% · NDVI与水肥相关性 r=0.78 · NDVI范围 [${viStats.ndvi.min.toFixed(2)}, ${viStats.ndvi.max.toFixed(2)}]`,
        costSaving: '本月节水 320m³ · 节肥 190kg · 节省成本 ￥3,850'
      },
      task: {
        totalPending: 21,
        totalWaiting: 38,
        totalCompleted: 34,
        completionRate: 65,
        overdue: 6,
        distribution: '灌溉26% 施肥23% 防控19% 修剪21% 采摘11%',
        performanceRank: '1. 张明 (28任务, 98%) 2. 李华 (26, 95%) 3. 王强 (24, 92%)',
        currentExecution: '实时作业: 灌溉组 @B2',
        feedbackPhotos: 38,
        overdueWarning: '施肥B5逾期1天 · 责任人李华',
        historyTrend: '近7天完成↑9% · 防控效率+6%'
      },
      history: {
        ndviTrend: `2025 Q1 NDVI: 0.66 → 0.70 (同比+0.04) · 地块B4增幅最大`,
        healthTrend: {
          lastYear: '2026占比 86%',
          thisYear: '2025 92%',
          thisYearValue: 92,
          prediction: 'Q3 93.5%'
        },
        qualityTrend: '单果重年均+6% · 糖度趋势 12.3→13.0 °Bx',
        abnormalTrend: '3月异常峰值94株 · 4月降至56株 · 红蜘蛛周期减弱',
        yearlyComparison: `NDVI 2025比2026 +0.03 · 健康度提升4% · 采样点 ${totalSamples}个`
      },
      collaboration: {
        accessStats: '微信小程序 44% · APP 30% · PC端 16% · 大屏10% · 活跃用户 156',
        traceCodes: 1980,
        scanCount: 1542,
        completeRate: 95,
        traceInfo: '果品B3-45: 施肥3.15, 检测报告合格 轮播',
        feedbackStats: '反馈19条 · 处理率89% · 满意度4.5',
        syncStatus: '同步成功 10:25 · 日志无异常',
        channelAnalysis: '电商扫码占52% · 批发市场24% · 门店24%  · 地域: 华南为主'
      }
    },
    '3': {
      totalTrees: 8901,
      coverage: 95,
      healthRate: 91,
      abnormalTrees: 65,
      weeklyAbnormalRate: 0.6,
      ndvi: (viStats.ndvi.mean - 0.03).toFixed(2),
      vigorRate: 76,
      lowRate: 5,
      highRisk: 16,
      spiderOutbreak: 3,
      pending: 12,
      irrigationProgress: 75,
      controlProgress: 56,
      deviceOnlineRate: 95,
      collectTime: '2026-03-08 10:23',
      pest: {
        spiderMite: 28,
        huanglongbing: 8,
        anthracnose: 15,
        trapPeak: 145,
        warningArea: '地块C4 🔴红蜘蛛 · 地块C8 🟡黄龙病',
        disasterArea: 2,
        tasks: {
          issued: 6,
          completed: 3,
          remaining: 3,
          completionRate: 50
        },
        controlCoverage: 85,
        pesticideUsage: '矿物油 24L · 阿维菌素 8L · 苯醚甲环唑 5L',
        controlEffect: '红蜘蛛减退率68% · 黄龙病砍除5株',
        tomorrowWarning: '明日预警: 蚜虫风险中 (地块C2)'
      },
      fertilizer: {
        deficiency: `缺氮 ${Math.floor(nutrientCounts.n * 0.73)}株 · 缺钾 ${Math.floor(nutrientCounts.k * 0.74)}株 · 缺水 ${Math.floor(nutrientCounts.water * 0.74)}株 · 缺磷 ${Math.floor(nutrientCounts.p * 0.75)}株`,
        recommendation: 'C1地块: 高钾肥3.5kg/亩 · 灌溉量20m³ 今日执行',
        irrigationProgress: 65,
        pendingBlocks: 'C3,C6',
        trend: `叶片氮含量 1.9% ↓0.12% · NDVI与水肥相关性 r=0.75 · NDVI范围 [${viStats.ndvi.min.toFixed(2)}, ${viStats.ndvi.max.toFixed(2)}]`,
        costSaving: '本月节水 280m³ · 节肥 160kg · 节省成本 ￥3,420'
      },
      task: {
        totalPending: 18,
        totalWaiting: 32,
        totalCompleted: 29,
        completionRate: 62,
        overdue: 5,
        distribution: '灌溉24% 施肥22% 防控20% 修剪22% 采摘12%',
        performanceRank: '1. 刘伟 (24任务, 97%) 2. 陈芳 (22, 94%) 3. 杨军 (20, 91%)',
        currentExecution: '实时作业: 防控组 @C5',
        feedbackPhotos: 32,
        overdueWarning: '修剪C9逾期1天 · 责任人陈芳',
        historyTrend: '近7天完成↑8% · 防控效率+5%'
      },
      history: {
        ndviTrend: `2025 Q1 NDVI: 0.64 → 0.68 (同比+0.04) · 地块C2增幅最大`,
        healthTrend: {
          lastYear: '2026占比 84%',
          thisYear: '2025 91%',
          thisYearValue: 91,
          prediction: 'Q3 92.5%'
        },
        qualityTrend: '单果重年均+5% · 糖度趋势 12.1→12.8 °Bx',
        abnormalTrend: '3月异常峰值82株 · 4月降至48株 · 红蜘蛛周期减弱',
        yearlyComparison: `NDVI 2025比2026 +0.03 · 健康度提升3% · 采样点 ${totalSamples}个`
      },
      collaboration: {
        accessStats: '微信小程序 42% · APP 32% · PC端 15% · 大屏11% · 活跃用户 132',
        traceCodes: 1650,
        scanCount: 1280,
        completeRate: 94,
        traceInfo: '果品C2-78: 施肥3.12, 检测报告合格 轮播',
        feedbackStats: '反馈16条 · 处理率87% · 满意度4.4',
        syncStatus: '同步成功 10:28 · 日志无异常',
        channelAnalysis: '电商扫码占50% · 批发市场25% · 门店25%  · 地域: 华南为主'
      }
    }
  }
  return baseData[region.value] || baseData['1']
})
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.dashboard-wrap {
  max-width: 1600px;
  margin: 0 auto;
  font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  color: #153728;
  padding: 20px;
  position: relative;
}

.back-button {
  position: sticky;
  top: 20px;
  right: 20px;
  left: auto;
  background: white;
  padding: 10px 20px;
  border-radius: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #2e8b57;
  border: 1px solid #b1dbbc;
  margin-bottom: 20px;
  transition: all 0.2s;
  z-index: 100;
  float: right;
}

.dashboard-wrap::after {
  content: "";
  display: table;
  clear: both;
}

.back-button:hover {
  background: #f0f9f0;
  transform: translateX(4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

h1 {
  font-size: 2.2rem;
  font-weight: 500;
  color: #154f31;
  display: flex;
  align-items: center;
  gap: 12px;
  letter-spacing: -0.5px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.region-badge {
  padding: 8px 24px;
  border-radius: 40px;
  color: white;
  font-size: 1.2rem;
  font-weight: 500;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.grid-6 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  clear: both;
}

.subscreen {
  background: white;
  border-radius: 32px;
  box-shadow: 0 20px 30px -12px #1f4b33a0;
  overflow: hidden;
  border: 1px solid #b6d5bd;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.subscreen:hover {
  box-shadow: 0 24px 40px -12px #1c5535;
  transform: translateY(-4px);
}

.card-header {
  background: linear-gradient(135deg, #e5f4e5, #cee9d4);
  padding: 26px 22px 26px 22px;
  border-bottom: 2px solid #a0c9ab;
}

.card-title {
  font-weight: 700;
  font-size: 1.645rem;
  color: #0a4d2b;
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title i {
  font-size: 1.8rem;
  color: #2b7d4e;
}

.card-body {
  padding: 22px 20px 24px 20px;
  background: #fefefd;
  flex: 1;
}

.spec-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.spec-table td {
  padding: 10px 6px;
  border-bottom: 1px dashed #bcddca;
  vertical-align: middle;
}

.spec-table tr {
  display: table-row;
}

.cat-col {
  font-weight: 700;
  color: #1b613c;
  width: 32%;
  background: #f2fcf5;
  border-radius: 12px 0 0 12px;
  padding-left: 16px;
  text-align: center;
  vertical-align: middle;
  display: table-cell;
  font-size: 1.05rem;
}

.data-col {
  color: #1f4f33;
  line-height: 1.5;
  vertical-align: middle;
}

.vi-badge {
  background: #e0efe5;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
  margin: 2px 4px 2px 0;
  border: 1px solid #9bc0a8;
  color: #1d5f3a;
}

.deficit-badge {
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
  margin: 2px 4px 2px 0;
  color: white;
}

.deficit-badge.n { background: #5f9ea0; }
.deficit-badge.p { background: #e1ad5d; }
.deficit-badge.k { background: #c45d32; }
.deficit-badge.water { background: #4794b3; }
.deficit-badge.other { background: #b58f5a; }

.corr-tag {
  background: #ecf9f0;
  border-radius: 16px;
  padding: 2px 8px;
  font-size: 0.7rem;
  display: inline-block;
  margin: 2px 4px 2px 0;
  border: 1px solid #b2dbc0;
}

.kpi-badge {
  background: #ecf9f0;
  border-radius: 40px;
  padding: 6px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-block;
  margin: 4px 8px 4px 0;
  border: 1px solid #b2dbc0;
}

.kpi-number-lg {
  font-size: 1.7rem;
  font-weight: 800;
  color: #1c6e42;
  display: inline-block;
  margin-right: 6px;
  line-height: 1.2;
}

.unit {
  font-size: 0.7rem;
  color: #5d8970;
}

.progress {
  height: 8px;
  background: #d9f0e0;
  border-radius: 20px;
  margin: 6px 0;
  width: 100%;
}

.progress-fill {
  height: 8px;
  background: #2c9c5e;
  border-radius: 20px;
  width: 72%;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mock-map-sm {
  background: #c3e0ce;
  height: 60px;
  border-radius: 20px;
  background-image: repeating-linear-gradient(45deg, #96c8a8 0px, #96c8a8 6px, #b1dabe 6px, #b1dabe 12px);
  border: 1px solid #7ab28b;
  margin: 8px 0 6px;
  position: relative;
}

.map-overlay {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 20px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-around;
  color: #1f5737;
  font-weight: 500;
  font-size: 0.7rem;
  padding: 0 10px;
}

.warn-flash {
  background: #ffefe6;
  border-left: 5px solid #d97335;
  padding: 12px 14px;
  border-radius: 16px;
  font-size: 0.8rem;
}

.dot-red {
  height: 12px;
  width: 12px;
  background: #d14b4b;
  border-radius: 50%;
  display: inline-block;
  margin-right: 4px;
}

.trend-up {
  color: #1f9b5a;
  font-weight: 600;
  font-size: 0.7rem;
}

@media (max-width: 1200px) {
  .grid-6 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .grid-6 {
    grid-template-columns: 1fr;
  }
}
</style>