// src/views/screen/hooks/use-screen-adapt.ts
import { onMounted, onUnmounted } from 'vue'

/**
 * 大屏分辨率自适应Hook
 * 基于设计稿1920x1080进行缩放
 */
export function useScreenAdapt(designWidth: number = 1920, designHeight: number = 1080) {
  const adapt = () => {
    const body = document.documentElement
    const scaleX = body.clientWidth / designWidth
    const scaleY = body.clientHeight / designHeight
    const scale = Math.min(scaleX, scaleY)

    // 可以通过CSS变量传递给子组件
    document.documentElement.style.setProperty('--scale-ratio', scale.toString())

    // 或者直接设置根字体大小用于rem
    document.documentElement.style.fontSize = `${16 * scale}px`
  }

  onMounted(() => {
    adapt()
    window.addEventListener('resize', adapt)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', adapt)
  })

  return { adapt }
}