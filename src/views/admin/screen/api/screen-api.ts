// src/views/screen/api/screen-api.ts
/**
 * 大屏数据接口示例
 * 实际使用时替换为真实API
 */

export interface YieldData {
  today: number
  total: number
  trend: number
}

export interface CountyYield {
  name: string
  value: number
}

export interface CategoryItem {
  name: string
  value: number
}

// 模拟请求延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const screenApi = {
  /**
   * 获取核心指标
   */
  async getCoreIndicators(): Promise<{ today: number; total: number; onlineRate: number }> {
    await delay(500)
    return {
      today: 1250.8,
      total: 328.4,
      onlineRate: 98.5
    }
  },

  /**
   * 获取品类占比
   */
  async getCategoryRatio(): Promise<CategoryItem[]> {
    await delay(600)
    return [
      { name: '温州蜜柑', value: 45 },
      { name: '椪柑', value: 28 },
      { name: '脐橙', value: 18 },
      { name: '其他', value: 9 }
    ]
  },

  /**
   * 获取主产县产量
   */
  async getCountyYield(): Promise<CountyYield[]> {
    await delay(400)
    return [
      { name: '临海', value: 60 },
      { name: '象山', value: 50 },
      { name: '常山', value: 55 },
      { name: '瑞安', value: 50 },
      { name: '黄岩', value: 55 }
    ]
  },

  /**
   * 获取周趋势
   */
  async getWeeklyTrend(): Promise<{ name: string; value: number }[]> {
    await delay(450)
    return [
      { name: '周一', value: 320 },
      { name: '周二', value: 332 },
      { name: '周三', value: 301 },
      { name: '周四', value: 334 },
      { name: '周五', value: 390 },
      { name: '周六', value: 410 },
      { name: '周日', value: 380 }
    ]
  }
}