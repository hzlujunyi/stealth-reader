<script setup lang="ts">
import { useSettingsStore } from '../stores/settings'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const settingsStore = useSettingsStore()

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

// 将颜色转换为十六进制格式供 color input 使用
function colorToHex(color: string): string {
  // 如果已经是 hex 格式
  if (color.startsWith('#')) {
    return color.length === 4
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : color.slice(0, 7)
  }
  // 解析 rgb/rgba 格式
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, '0')
    const g = parseInt(match[2]).toString(16).padStart(2, '0')
    const b = parseInt(match[3]).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
  }
  return '#ffffff'
}

// 当前取色的目标设置项
let currentPickTarget: 'textColor' | 'backgroundColor' | null = null
// 保存取色前的窗口状态
let pickerOriginalBounds: { x: number; y: number; width: number; height: number } | null = null

// 使用 desktopCapturer 从全屏截图取色
async function pickColorFromScreen(settingKey: 'textColor' | 'backgroundColor') {
  if (!window.electronAPI) {
    alert('electronAPI 不可用')
    return
  }

  try {
    // 保存当前窗口位置和大小
    pickerOriginalBounds = await window.electronAPI.getWindowBounds()

    // 把窗口移到屏幕外（比隐藏更可靠）
    await window.electronAPI.setWindowBounds({ x: -10000, y: -10000 })
    // 等待窗口移动完成
    await new Promise(resolve => setTimeout(resolve, 300))

    // 截取全屏
    const dataUrl = await window.electronAPI.captureScreen()
    if (!dataUrl) {
      alert('截屏失败')
      // 恢复窗口位置
      if (pickerOriginalBounds) {
        await window.electronAPI.setWindowBounds(pickerOriginalBounds)
        pickerOriginalBounds = null
      }
      return
    }

    // 把窗口最大化到全屏以显示截图（从屏幕外移回来）
    await window.electronAPI.setWindowBounds({ x: 0, y: 0, width: screen.width, height: screen.height })

    // 记录当前取色目标
    currentPickTarget = settingKey

    // 创建全屏取色界面
    showColorPickerOverlay(dataUrl)
  } catch (e) {
    console.error('取色失败:', e)
    // 恢复窗口位置
    if (pickerOriginalBounds && window.electronAPI) {
      await window.electronAPI.setWindowBounds(pickerOriginalBounds)
      pickerOriginalBounds = null
    }
  }
}

// 显示全屏取色覆盖层
function showColorPickerOverlay(imageDataUrl: string) {
  // 创建覆盖层
  const overlay = document.createElement('div')
  overlay.id = 'color-picker-overlay'
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    cursor: crosshair;
    background-image: url(${imageDataUrl});
    background-size: cover;
    background-position: center;
  `

  // 创建放大镜
  const magnifier = document.createElement('div')
  magnifier.style.cssText = `
    position: fixed;
    width: 120px;
    height: 120px;
    border: 2px solid #fff;
    border-radius: 50%;
    pointer-events: none;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
    overflow: hidden;
    display: none;
  `

  const magnifierCanvas = document.createElement('canvas')
  magnifierCanvas.width = 120
  magnifierCanvas.height = 120
  magnifier.appendChild(magnifierCanvas)

  // 创建颜色预览
  const colorPreview = document.createElement('div')
  colorPreview.style.cssText = `
    position: fixed;
    padding: 8px 12px;
    background: rgba(0,0,0,0.8);
    color: white;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
    display: none;
  `

  // 提示文字
  const hint = document.createElement('div')
  hint.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    background: rgba(0,0,0,0.8);
    color: white;
    border-radius: 4px;
    font-size: 14px;
  `
  hint.textContent = '点击选取颜色，按 ESC 取消'

  overlay.appendChild(magnifier)
  overlay.appendChild(colorPreview)
  overlay.appendChild(hint)
  document.body.appendChild(overlay)

  // 加载图片到 canvas 以获取像素
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)

    // 鼠标移动事件
    overlay.addEventListener('mousemove', (e) => {
      const x = e.clientX
      const y = e.clientY

      // 计算图片坐标（考虑窗口和图片尺寸差异）
      const scaleX = img.width / window.innerWidth
      const scaleY = img.height / window.innerHeight
      const imgX = Math.floor(x * scaleX)
      const imgY = Math.floor(y * scaleY)

      // 获取像素颜色
      const pixel = ctx.getImageData(imgX, imgY, 1, 1).data
      const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`

      // 更新颜色预览
      colorPreview.style.display = 'block'
      colorPreview.style.left = `${x + 20}px`
      colorPreview.style.top = `${y + 20}px`
      colorPreview.innerHTML = `<span style="display:inline-block;width:12px;height:12px;background:${hex};border:1px solid #fff;margin-right:6px;vertical-align:middle;"></span>${hex}`

      // 更新放大镜
      magnifier.style.display = 'block'
      magnifier.style.left = `${x - 60}px`
      magnifier.style.top = `${y - 140}px`

      const magCtx = magnifierCanvas.getContext('2d')!
      magCtx.imageSmoothingEnabled = false
      magCtx.clearRect(0, 0, 120, 120)
      // 放大 8 倍显示
      const zoomSize = 15
      magCtx.drawImage(
        canvas,
        imgX - zoomSize / 2, imgY - zoomSize / 2, zoomSize, zoomSize,
        0, 0, 120, 120
      )
      // 画中心十字
      magCtx.strokeStyle = '#fff'
      magCtx.lineWidth = 1
      magCtx.beginPath()
      magCtx.moveTo(60, 50)
      magCtx.lineTo(60, 70)
      magCtx.moveTo(50, 60)
      magCtx.lineTo(70, 60)
      magCtx.stroke()
    })

    // 点击选取颜色
    overlay.addEventListener('click', (e) => {
      const scaleX = img.width / window.innerWidth
      const scaleY = img.height / window.innerHeight
      const imgX = Math.floor(e.clientX * scaleX)
      const imgY = Math.floor(e.clientY * scaleY)

      const pixel = ctx.getImageData(imgX, imgY, 1, 1).data
      const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`

      if (currentPickTarget) {
        settingsStore.updateSetting(currentPickTarget, hex)
      }

      cleanup()
    })

    // ESC 取消
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup()
      }
    }
    document.addEventListener('keydown', handleKeydown)

    async function cleanup() {
      document.removeEventListener('keydown', handleKeydown)
      overlay.remove()
      currentPickTarget = null

      // 恢复原来的窗口大小和位置
      if (pickerOriginalBounds && window.electronAPI) {
        await window.electronAPI.setWindowBounds(pickerOriginalBounds)
        pickerOriginalBounds = null
      }
    }
  }
  img.src = imageDataUrl
}
</script>

<template>
  <div class="overlay" @click="handleOverlayClick">
    <div class="panel">
      <div class="header">
        <h3>设置</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="content">
        <!-- 显示设置 -->
        <div class="section">
          <h4>显示设置</h4>

          <div class="field">
            <label>显示行数</label>
            <input
              type="number"
              :value="settingsStore.settings.displayLines"
              @input="settingsStore.updateSetting('displayLines', Number(($event.target as HTMLInputElement).value))"
              min="1"
              max="20"
            />
          </div>

          <div class="field">
            <label>字体大小</label>
            <input
              type="number"
              :value="settingsStore.settings.fontSize"
              @input="settingsStore.updateSetting('fontSize', Number(($event.target as HTMLInputElement).value))"
              min="10"
              max="30"
            />
          </div>

          <div class="field">
            <label>文字颜色</label>
            <div class="color-picker">
              <input
                type="color"
                :value="settingsStore.settings.textColor"
                @input="settingsStore.updateSetting('textColor', ($event.target as HTMLInputElement).value)"
              />
              <button class="eyedropper-btn" @click="pickColorFromScreen('textColor')" title="从屏幕取色">
                🎯
              </button>
            </div>
          </div>

          <div class="field">
            <label>背景颜色</label>
            <div class="color-picker">
              <input
                type="color"
                :value="colorToHex(settingsStore.settings.backgroundColor)"
                @input="settingsStore.updateSetting('backgroundColor', ($event.target as HTMLInputElement).value)"
              />
              <button class="eyedropper-btn" @click="pickColorFromScreen('backgroundColor')" title="从屏幕取色">
                🎯
              </button>
            </div>
          </div>

          <div class="field">
            <label>文字对齐</label>
            <select
              :value="settingsStore.settings.textAlign"
              @change="settingsStore.updateSetting('textAlign', ($event.target as HTMLSelectElement).value as 'left' | 'center' | 'right')"
            >
              <option value="left">左对齐</option>
              <option value="center">居中</option>
              <option value="right">右对齐</option>
            </select>
          </div>
        </div>

        <!-- 窗口设置 -->
        <div class="section">
          <h4>窗口设置</h4>

          <div class="field">
            <label>透明度 ({{ settingsStore.settings.opacity }}%)</label>
            <input
              type="range"
              :value="settingsStore.settings.opacity"
              @input="settingsStore.updateSetting('opacity', Number(($event.target as HTMLInputElement).value))"
              min="10"
              max="100"
            />
          </div>

          <div class="field checkbox">
            <input
              type="checkbox"
              id="alwaysOnTop"
              :checked="settingsStore.settings.alwaysOnTop"
              @change="settingsStore.updateSetting('alwaysOnTop', ($event.target as HTMLInputElement).checked)"
            />
            <label for="alwaysOnTop">窗口置顶</label>
          </div>

          <div class="field checkbox">
            <input
              type="checkbox"
              id="autoHide"
              :checked="settingsStore.settings.autoHideOnMouseLeave"
              @change="settingsStore.updateSetting('autoHideOnMouseLeave', ($event.target as HTMLInputElement).checked)"
            />
            <label for="autoHide">鼠标移开自动隐藏</label>
          </div>
        </div>

        <!-- 交互设置 -->
        <div class="section">
          <h4>交互设置</h4>

          <div class="field checkbox">
            <input
              type="checkbox"
              id="clickToNextPage"
              :checked="settingsStore.settings.clickToNextPage"
              @change="settingsStore.updateSetting('clickToNextPage', ($event.target as HTMLInputElement).checked)"
            />
            <label for="clickToNextPage">点击翻页</label>
          </div>

          <div class="field checkbox">
            <input
              type="checkbox"
              id="autoScroll"
              :checked="settingsStore.settings.autoScroll"
              @change="settingsStore.updateSetting('autoScroll', ($event.target as HTMLInputElement).checked)"
            />
            <label for="autoScroll">自动翻页</label>
          </div>

          <div class="field" v-if="settingsStore.settings.autoScroll">
            <label>翻页间隔 (秒)</label>
            <input
              type="number"
              :value="settingsStore.settings.autoScrollInterval"
              @input="settingsStore.updateSetting('autoScrollInterval', Number(($event.target as HTMLInputElement).value))"
              min="1"
              max="60"
            />
          </div>
        </div>

        <div class="actions">
          <button @click="settingsStore.resetSettings()">恢复默认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.panel {
  background: #fff;
  border-radius: 8px;
  width: 360px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #666;
}

.content {
  padding: 20px;
  overflow-y: auto;
}

.content::-webkit-scrollbar {
  width: 4px;
}

.content::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.section {
  margin-bottom: 24px;
}

.section:last-of-type {
  margin-bottom: 0;
}

.section h4 {
  margin: 0 0 12px 0;
  font-size: 11px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.field label {
  flex: 1;
  font-size: 13px;
  color: #555;
}

.field input[type="number"] {
  width: 72px;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  color: #333;
  background: #fff;
  outline: none;
}

.field select {
  width: auto;
  min-width: 80px;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  color: #333;
  background: #fff;
  outline: none;
}

.field input[type="number"]:focus {
  border-color: #999;
}

.field select:focus {
  border-color: #999;
}

.field input[type="range"] {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  background: #e5e5e5;
  border-radius: 2px;
  outline: none;
}

.field input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  background: #666;
  border-radius: 50%;
  cursor: pointer;
}

.field input[type="color"] {
  width: 36px;
  height: 28px;
  padding: 1px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 6px;
}

.eyedropper-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eyedropper-btn:hover {
  background: #f5f5f5;
}

.field.checkbox {
  flex-direction: row-reverse;
  justify-content: flex-end;
  gap: 8px;
}

.field.checkbox label {
  flex: none;
  cursor: pointer;
}

.field.checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #666;
  cursor: pointer;
}

.actions {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  text-align: center;
}

.actions button {
  padding: 8px 20px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
}

.actions button:hover {
  background: #eee;
}
</style>
