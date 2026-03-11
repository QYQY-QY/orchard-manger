<template>
  <div class="stats-panel">
    <div class="panel-header">
      <span class="icon">📊</span>
      <h3>种植区数据</h3>
      <span class="badge">实时更新</span>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="card-icon">🗺️</div>
        <div class="card-content">
          <div class="card-label">种植区数量</div>
          <div class="card-value">{{ 种植区数量 }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="card-icon">📏</div>
        <div class="card-content">
          <div class="card-label">总面积</div>
          <div class="card-value">{{ 总面积 }}<span class="unit">亩</span></div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="card-icon">🌳</div>
        <div class="card-content">
          <div class="card-label">果树总数</div>
          <div class="card-value">{{ 果树总数 }}<span class="unit">棵</span></div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="card-icon">📦</div>
        <div class="card-content">
          <div class="card-label">预估年产量</div>
          <div class="card-value">{{ 年产量 }}<span class="unit">吨</span></div>
        </div>
      </div>
    </div>
    
    <div class="tips">
      <div class="tip-item">🍊 不规则地面拼块</div>
      <div class="tip-item">🍎 鼠标悬停凸起</div>
      <div class="tip-item">👆 点击查看详情</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  种植区数量: Number,
  总面积: Number,
  果树总数: Number,
  年产量: Number
})
</script>

<style scoped>
.stats-panel {
  position: absolute;
  bottom: 24px;
  right: 24px;
  background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,248,0.92) 100%);
  color: #2d3748;
  padding: 24px;
  border-radius: 20px;
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05);
  z-index: 100;
  pointer-events: none;
  border: 1px solid rgba(45, 90, 39, 0.1);
  min-width: 340px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f4f0;
}

.panel-header .icon {
  font-size: 1.4rem;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: #2d5a27;
}

.badge {
  margin-left: auto;
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(72, 187, 120, 0.3);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #f7faf7, #f0f7f0);
  padding: 14px;
  border-radius: 14px;
  border: 1px solid rgba(74, 140, 63, 0.15);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 140, 63, 0.15);
  border-color: rgba(74, 140, 63, 0.3);
}

.card-icon {
  font-size: 1.8rem;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 0.8rem;
  color: #718096;
  margin-bottom: 2px;
  font-weight: 500;
}

.card-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #2d5a27;
  line-height: 1;
}

.card-value .unit {
  font-size: 0.8rem;
  font-weight: 500;
  color: #4a8c3f;
  margin-left: 2px;
}

.tips {
  display: flex;
  justify-content: space-around;
  padding-top: 12px;
  border-top: 1px solid #f0f4f0;
}

.tip-item {
  font-size: 0.85rem;
  color: #718096;
  text-align: center;
}
</style>