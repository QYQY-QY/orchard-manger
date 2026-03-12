// src/views/screen/hooks/use-format.ts
/**
 * 数据格式化工具
 */
export function useFormat() {
  /**
   * 格式化数字 (添加千位分隔符, 保留小数位)
   */
  const formatNumber = (num: number, digits: number = 1): string => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    })
  }

  /**
   * 格式化日期
   */
  const formatDate = (date: Date | string | number, format: string = 'yyyy-MM-dd HH:mm'): string => {
    const d = new Date(date)
    const map: Record<string, any> = {
      yyyy: d.getFullYear(),
      MM: String(d.getMonth() + 1).padStart(2, '0'),
      dd: String(d.getDate()).padStart(2, '0'),
      HH: String(d.getHours()).padStart(2, '0'),
      mm: String(d.getMinutes()).padStart(2, '0'),
      ss: String(d.getSeconds()).padStart(2, '0')
    }
    return format.replace(/yyyy|MM|dd|HH|mm|ss/g, matched => map[matched])
  }

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    formatNumber,
    formatDate,
    formatFileSize
  }
}