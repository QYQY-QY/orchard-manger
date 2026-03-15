<!-- TotalScreen.vue - 山地果园AI单株精准管理 · 六子大屏总览 -->
<template>
  <div class="dashboard-wrap">
    <!-- 返回按钮 -->
    <div class="back-button" @click="goBack">
      <i class="fas fa-arrow-left"></i> 返回地图
    </div>
    
    <h1>
      <i class="fas fa-tree" style="color: #256b43;"></i> 
      区域{{ region }} · 山地果园AI单株精准管理
      <span class="region-badge" :style="{ backgroundColor: regionColor }">
        {{ regionName }}
      </span>
      <span style="font-size: 0.9rem; background: #edfff0; padding: 6px 16px; border-radius: 40px; margin-left: auto;">
        假数据填充·交互示意
      </span>
    </h1>
    <div class="sub-header">
      <i class="fas fa-users"></i> 
      适用角色: 园区负责人/植保/农艺/生产主管/数据分析/溯源 · 六屏联动 · 底层同源 · 当前区域: {{ regionName }}
    </div>

    <!-- 六个大屏网格 -->
    <div class="grid-6">
      <!-- 大屏1 宏观监控总览 -->
      <div class="subscreen" @click="navigateToScreen('Overview')">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-globe-asia"></i> 果园宏观监控总览</div>
          <span class="role-pill">园区负责人 · 运营总监</span>
          <div class="core-mission">全局态势 · 健康度热力</div>
        </div>
        <div class="card-body">
          <table class="spec-table">
            <tr>
              <td class="cat-col">核心KPI</td>
              <td class="data-col">
                <span class="kpi-number-lg">{{ formatNumber(regionData.totalTrees) }}</span><span class="unit">总株</span> 
                <span style="margin-left: 12px;"><i class="fas fa-check-circle" style="color:#259456;"></i> 覆盖率{{ regionData.coverage }}%</span>
                <br>
                <span class="kpi-badge">健康株占比 {{ regionData.healthRate }}%</span> 
                <span class="kpi-badge">异常株 {{ regionData.abnormalTrees }}</span> 
                <span class="kpi-badge">周均异常率 {{ regionData.weeklyAbnormalRate }}% <i class="fas fa-arrow-down trend-up"></i></span>
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
                  <span class="dot-red"></span> 高危预警株: {{ regionData.highRisk }} (黄龙病疑似) · 红蜘蛛爆发区 {{ regionData.spiderOutbreak }}个 
                  <span style="background:#f0b27a; border-radius:20px; padding:2px 8px;">待处理{{ regionData.pending }}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td class="cat-col">核心农事概览</td>
              <td class="data-col">
                <div class="flex-between"><span>灌溉完成</span><span>{{ regionData.irrigationProgress }}%</span></div>
                <div class="progress"><div class="progress-fill" :style="{ width: regionData.irrigationProgress + '%' }"></div></div>
                <div class="flex-between"><span>防控进度</span><span>{{ regionData.controlProgress }}%</span></div>
                <div class="progress"><div class="progress-fill" :style="{ width: regionData.controlProgress + '%' }"></div></div>
              </td>
            </tr>
            <tr>
              <td class="cat-col">设备在线状态</td>
              <td class="data-col">
                <i class="fas fa-circle" style="color:#3bba6f;"></i> 在线率 {{ regionData.deviceOnlineRate }}% · 采集时间 {{ regionData.collectTime }}
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- 大屏2 病虫害专项防控 -->
      <div class="subscreen" @click="navigateToScreen('PestControl')">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-bug"></i> 病虫害专项防控</div>
          <span class="role-pill">植保专员 · 防控负责人</span>
          <div class="core-mission">精准防控 · 全流程监控</div>
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
                今日派发{{ regionData.pest.tasks.issued }}单 · 完成{{ regionData.pest.tasks.completed }}单 · 剩余{{ regionData.pest.tasks.remaining }}单
                <br>
                <div class="progress"><div class="progress-fill" :style="{ width: regionData.pest.tasks.completionRate + '%' }"></div></div>
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

      <!-- 大屏3 水肥精准管控决策 -->
      <div class="subscreen" @click="navigateToScreen('WaterFertilizer')">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-tint"></i> 水肥精准管控决策</div>
          <span class="role-pill">农艺师 · 水肥专员</span>
          <div class="core-mission">多光谱诊断 · 节本增效</div>
        </div>
        <div class="card-body">
          <table class="spec-table">
            <tr>
              <td class="cat-col">水肥缺失诊断</td>
              <td class="data-col">
                {{ regionData.fertilizer.deficiency }}
                <span class="badge">柱状图↗️</span>
              </td>
            </tr>
            <tr>
              <td class="cat-col">精准施肥建议</td>
              <td class="data-col">
                🍎 {{ regionData.fertilizer.recommendation }}
              </td>
            </tr>
            <tr>
              <td class="cat-col">水肥任务进度</td>
              <td class="data-col">
                <div class="flex-between"><span>灌溉完成</span><span>{{ regionData.fertilizer.irrigationProgress }}%</span></div>
                <div class="progress"><div class="progress-fill" :style="{ width: regionData.fertilizer.irrigationProgress + '%' }"></div></div>
                未执行地块: {{ regionData.fertilizer.pendingBlocks }}
              </td>
            </tr>
            <tr>
              <td class="cat-col">养分趋势分析</td>
              <td class="data-col">
                {{ regionData.fertilizer.trend }}
              </td>
            </tr>
            <tr>
              <td class="cat-col">水肥成本统计</td>
              <td class="data-col">
                {{ regionData.fertilizer.costSaving }}
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- 大屏4 农事任务调度管理 -->
      <div class="subscreen" @click="navigateToScreen('TaskDispatch')">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-tasks"></i> 农事任务调度管理</div>
          <span class="role-pill">生产主管 · 调度员</span>
          <div class="core-mission">全流程执行 · 人员绩效</div>
        </div>
        <div class="card-body">
          <table class="spec-table">
            <tr>
              <td class="cat-col">任务总览</td>
              <td class="data-col">
                <span class="kpi-number-lg">{{ regionData.task.totalPending }}</span>待派发 / 
                <span class="kpi-number-lg">{{ regionData.task.totalWaiting }}</span>待执行 / 完成{{ regionData.task.totalCompleted }} 
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
            <tr>
              <td class="cat-col">任务历史趋势</td>
              <td class="data-col">
                {{ regionData.task.historyTrend }}
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- 大屏5 历史数据趋势分析 -->
      <div class="subscreen" @click="navigateToScreen('HistoricalTrend')">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-chart-line"></i> 历史数据趋势分析</div>
          <span class="role-pill">技术人员 · 数据分析师</span>
          <div class="core-mission">长期对比 · 效果评估</div>
        </div>
        <div class="card-body">
          <table class="spec-table">
            <tr>
              <td class="cat-col">NDVI长期趋势</td>
              <td class="data-col">
                📈 {{ regionData.history.ndviTrend }}
              </td>
            </tr>
            <tr>
              <td class="cat-col">健康株占比趋势</td>
              <td class="data-col">
                <div class="flex-between"><span>{{ regionData.history.healthTrend.lastYear }}</span> <span>{{ regionData.history.healthTrend.thisYear }}</span></div>
                <div class="progress"><div class="progress-fill" :style="{ width: regionData.history.healthTrend.thisYearValue + '%' }"></div></div>
                预测 {{ regionData.history.healthTrend.prediction }}
              </td>
            </tr>
            <tr>
              <td class="cat-col">产量/品质相关</td>
              <td class="data-col">
                {{ regionData.history.qualityTrend }}
              </td>
            </tr>
            <tr>
              <td class="cat-col">异常株时序</td>
              <td class="data-col">
                {{ regionData.history.abnormalTrend }}
              </td>
            </tr>
            <tr>
              <td class="cat-col">年度对比</td>
              <td class="data-col">
                {{ regionData.history.yearlyComparison }}
              </td>
            </tr>
          </table>
          <!-- 模拟小面积堆叠图 -->
          <div style="background:#f2faf0; border-radius:24px; padding:12px; margin-top:8px;">
            <i class="fas fa-chart-area"></i> 堆叠面积 · 健康/亚健康/异常趋势
          </div>
        </div>
      </div>

      <!-- 大屏6 多端协同与溯源管理 -->
      <div class="subscreen" @click="navigateToScreen('MultiCooperation')">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-handshake"></i> 多端协同&溯源</div>
          <span class="role-pill">运营 · 溯源管理员</span>
          <div class="core-mission">多端互通 · 追溯信息</div>
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
                <span class="kpi-number-lg">{{ regionData.collaboration.traceCodes }}</span> 溯源码生成  · 扫码查询 {{ regionData.collaboration.scanCount }} · 完整率{{ regionData.collaboration.completeRate }}%
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
    <div style="background: #e6f3e6; border-radius: 36px; padding: 28px 32px; margin-top: 36px; border: 1px solid #b1dbbc;">
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
        <i class="fas fa-seedling"></i> 文档注: 部分内容由AI生成 · 所有数据均为假数据模拟，仅用于展示子大屏拆分方案
      </div>
    </div>

    <!-- 微交互 跨屏联动占位说明 -->
    <div style="display: flex; gap: 16px; margin-top: 24px; font-size:0.85rem; background: white; border-radius: 100px; padding: 12px 24px; width: fit-content; border:1px solid #a7cdb2;">
      <span><i class="fas fa-chart-pie"></i> 六屏底层同源</span>
      <span><i class="fas fa-arrow-right"></i> 宏观总览点击异常株可跳转病虫害大屏(示意)</span>
      <span><i class="fas fa-table"></i> 假数据填充 · 参考文档表格</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

// 获取区域参数，默认为'1'
const region = computed(() => route.query.region || '1')

// 区域名称映射
const regionName = computed(() => {
  const names = {
    '1': '婺城区',
    '2': '金东区',
    '3': '武义县'
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
      query: { region: region.value }
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
      totalTrees: 12850,
      coverage: 98,
      healthRate: 94,
      abnormalTrees: 87,
      weeklyAbnormalRate: 0.7,
      ndvi: 0.72,
      vigorRate: 82,
      lowRate: 3,
      highRisk: 23,
      spiderOutbreak: 5,
      pending: 18,
      irrigationProgress: 82,
      controlProgress: 63,
      deviceOnlineRate: 97,
      collectTime: '2025-04-07 10:23',
      pest: {
        spiderMite: 35,
        huanglongbing: 12,
        anthracnose: 21,
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
        deficiency: '缺氮 44株 · 缺钾 31株 · 缺水 19株 · 缺磷 16株',
        recommendation: 'A1地块: 高氮水溶肥5kg/亩 · 灌溉量25m³ 今日执行',
        irrigationProgress: 71,
        pendingBlocks: 'B2,B5',
        trend: '叶片氮含量 2.1% ↓0.2% · NDVI与水肥相关性 r=0.81',
        costSaving: '本月节水 380m³ · 节肥 230kg · 节省成本 ￥4,260'
      },
      task: {
        totalPending: 24,
        totalWaiting: 42,
        totalCompleted: 38,
        completionRate: 68,
        overdue: 7,
        distribution: '灌溉28% 施肥22% 防控18% 修剪20% 采摘12%',
        performanceRank: '1. 王兴海 (32任务, 100%) 2. 李凤英 (29, 96%) 3. 赵德柱 (27, 93%)',
        currentExecution: '实时作业: 修剪组 @C4',
        feedbackPhotos: 42,
        overdueWarning: '采摘B3逾期2天 · 责任人张茂',
        historyTrend: '近7天完成↑12% · 防控效率+8%'
      },
      history: {
        ndviTrend: '2025 Q1 NDVI: 0.68 → 0.73 (同比+0.05) · 地块C7增幅最大',
        healthTrend: {
          lastYear: '2024占比 88%',
          thisYear: '2025 94%',
          thisYearValue: 94,
          prediction: 'Q3 95.5%'
        },
        qualityTrend: '单果重年均+7% · 糖度趋势 12.5→13.2 °Bx',
        abnormalTrend: '3月异常峰值107株 · 4月降至62株 · 红蜘蛛周期减弱',
        yearlyComparison: 'NDVI 2025比2024 +0.04 · 健康度提升5%'
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
      ndvi: 0.70,
      vigorRate: 79,
      lowRate: 4,
      highRisk: 19,
      spiderOutbreak: 4,
      pending: 15,
      irrigationProgress: 78,
      controlProgress: 59,
      deviceOnlineRate: 96,
      collectTime: '2025-04-07 10:25',
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
        deficiency: '缺氮 38株 · 缺钾 27株 · 缺水 16株 · 缺磷 14株',
        recommendation: 'B2地块: 平衡肥4kg/亩 · 灌溉量22m³ 今日执行',
        irrigationProgress: 68,
        pendingBlocks: 'B4,B6',
        trend: '叶片氮含量 2.0% ↓0.15% · NDVI与水肥相关性 r=0.78',
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
        ndviTrend: '2025 Q1 NDVI: 0.66 → 0.70 (同比+0.04) · 地块B4增幅最大',
        healthTrend: {
          lastYear: '2024占比 86%',
          thisYear: '2025 92%',
          thisYearValue: 92,
          prediction: 'Q3 93.5%'
        },
        qualityTrend: '单果重年均+6% · 糖度趋势 12.3→13.0 °Bx',
        abnormalTrend: '3月异常峰值94株 · 4月降至56株 · 红蜘蛛周期减弱',
        yearlyComparison: 'NDVI 2025比2024 +0.03 · 健康度提升4%'
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
      ndvi: 0.68,
      vigorRate: 76,
      lowRate: 5,
      highRisk: 16,
      spiderOutbreak: 3,
      pending: 12,
      irrigationProgress: 75,
      controlProgress: 56,
      deviceOnlineRate: 95,
      collectTime: '2025-04-07 10:28',
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
        deficiency: '缺氮 32株 · 缺钾 23株 · 缺水 14株 · 缺磷 12株',
        recommendation: 'C1地块: 高钾肥3.5kg/亩 · 灌溉量20m³ 今日执行',
        irrigationProgress: 65,
        pendingBlocks: 'C3,C6',
        trend: '叶片氮含量 1.9% ↓0.12% · NDVI与水肥相关性 r=0.75',
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
        ndviTrend: '2025 Q1 NDVI: 0.64 → 0.68 (同比+0.04) · 地块C2增幅最大',
        healthTrend: {
          lastYear: '2024占比 84%',
          thisYear: '2025 91%',
          thisYearValue: 91,
          prediction: 'Q3 92.5%'
        },
        qualityTrend: '单果重年均+5% · 糖度趋势 12.1→12.8 °Bx',
        abnormalTrend: '3月异常峰值82株 · 4月降至48株 · 红蜘蛛周期减弱',
        yearlyComparison: 'NDVI 2025比2024 +0.03 · 健康度提升3%'
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
  left: 20px;
  background: white;
  padding: 10px 20px;
  border-radius: 40px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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
}

.back-button:hover {
  background: #f0f9f0;
  transform: translateX(-4px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.15);
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
}

.region-badge {
  padding: 8px 24px;
  border-radius: 40px;
  color: white;
  font-size: 1.2rem;
  font-weight: 500;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.sub-header {
  background: #eff9f0;
  border-radius: 40px;
  padding: 12px 28px;
  margin: 16px 0 28px 0;
  border-left: 8px solid #2e8b57;
  font-size: 1.0rem;
  color: #235f3a;
  box-shadow: 0 4px 8px rgba(0,40,20,0.05);
  font-weight: 400;
}

.grid-6 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* 卡片设计 */
.subscreen {
  background: white;
  border-radius: 32px;
  box-shadow: 0 20px 30px -12px #1f4b33a0;
  overflow: hidden;
  border: 1px solid #b6d5bd;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  cursor: pointer; /* 添加手型光标，提示可点击 */
}

.subscreen:hover {
  box-shadow: 0 24px 40px -12px #1c5535;
  transform: translateY(-4px); /* 添加悬停上浮效果 */
}

.card-header {
  background: linear-gradient(135deg, #e5f4e5, #cee9d4);
  padding: 18px 22px 12px 22px;
  border-bottom: 2px solid #a0c9ab;
}

.card-title {
  font-weight: 700;
  font-size: 1.3rem;
  color: #0a4d2b;
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title i {
  font-size: 1.8rem;
  color: #2b7d4e;
}

.role-pill {
  display: inline-block;
  background: #1d6e41;
  color: white;
  font-size: 0.7rem;
  border-radius: 50px;
  padding: 3px 14px;
  margin-top: 8px;
  letter-spacing: 0.3px;
}

.core-mission {
  font-size: 0.78rem;
  color: #286b40;
  margin-top: 4px;
  font-style: italic;
}

.card-body {
  padding: 22px 20px 24px 20px;
  background: #fefefd;
  flex: 1;
}

/* 数据表格风格 */
.spec-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.spec-table td {
  padding: 10px 6px;
  border-bottom: 1px dashed #bcddca;
  vertical-align: top;
}

.spec-table tr:last-child td {
  border-bottom: none;
}

.cat-col {
  font-weight: 600;
  color: #1b613c;
  width: 32%;
  background: #f2fcf5;
  border-radius: 12px 0 0 12px;
  padding-left: 16px;
}

.data-col {
  color: #1f4f33;
  line-height: 1.5;
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
  background: rgba(0,0,0,0.03);
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

.dot-orange {
  background: #e68a3a;
}

.dot-green {
  background: #389e6b;
}

.inline-icon {
  margin-right: 6px;
  color: #2b8a55;
}

hr {
  border: 0.5px solid #cde0d3;
  margin: 14px 0;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.trend-up {
  color: #1f9b5a;
  font-weight: 600;
  font-size: 0.7rem;
}
</style>