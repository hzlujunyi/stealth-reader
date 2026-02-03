<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useBookStore } from '../stores/book'
import { useSettingsStore } from '../stores/settings'
import { useStatisticsStore } from '../stores/statistics'

const bookStore = useBookStore()
const settingsStore = useSettingsStore()
const statisticsStore = useStatisticsStore()

let autoScrollTimer: ReturnType<typeof setInterval> | null = null

// 容器宽度测量
const readerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(300)

// 当前行内的字符偏移（用于长行的部分显示）
const charOffset = ref(0)

// 当书籍或行变化时重置字符偏移
watch(() => bookStore.currentBook?.currentLine, () => {
  charOffset.value = 0
})

// 防抖 resize
let resizeTimer: ReturnType<typeof setTimeout> | null = null
function handleResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    if (readerRef.value) {
      containerWidth.value = readerRef.value.clientWidth - 24 // 减去左右 padding
    }
  }, 150)
}

// 每行字符数（中文字符宽度约等于字体大小）
const charsPerLine = computed(() => {
  const fontSize = settingsStore.settings.fontSize
  // 中文字符宽度约 1em，使用保守估计确保不会溢出
  return Math.floor(containerWidth.value / fontSize)
})

// 重排后的显示行
const displayedLines = computed(() => {
  if (!bookStore.currentBook) return []

  const { lines, currentLine } = bookStore.currentBook
  const displayCount = settingsStore.settings.displayLines
  const maxChars = charsPerLine.value

  if (maxChars <= 0) return []

  // 从当前位置获取足够的原始行
  const result: string[] = []
  let originalIndex = currentLine
  let skipChars = charOffset.value // 当前行要跳过的字符数

  while (result.length < displayCount && originalIndex < lines.length) {
    let originalLine = lines[originalIndex] || ''

    // 如果是第一行，需要跳过已读的字符
    if (originalIndex === currentLine && skipChars > 0) {
      originalLine = originalLine.slice(skipChars)
    }

    if (originalLine.length === 0) {
      // 空行保留
      result.push('')
      originalIndex++
    } else if (originalLine.length <= maxChars) {
      // 短行直接添加
      result.push(originalLine)
      originalIndex++
    } else {
      // 长行需要切分
      let remaining = originalLine
      while (remaining.length > 0 && result.length < displayCount) {
        result.push(remaining.slice(0, maxChars))
        remaining = remaining.slice(maxChars)
      }
      // 如果这行还没切完，不要移动到下一行
      if (remaining.length === 0) {
        originalIndex++
      }
    }
  }

  return result.slice(0, displayCount)
})

// 向下滚动一个视觉行
function scrollDown() {
  if (!bookStore.currentBook) return

  const { lines, currentLine } = bookStore.currentBook
  const maxChars = charsPerLine.value
  const currentOriginalLine = lines[currentLine] || ''
  const remainingInLine = currentOriginalLine.length - charOffset.value

  if (remainingInLine > maxChars) {
    // 当前行还有更多内容，移动字符偏移
    charOffset.value += maxChars
  } else {
    // 当前行读完了，移动到下一行
    charOffset.value = 0
    bookStore.nextPage(1)
  }
}

// 向上滚动一个视觉行
function scrollUp() {
  if (!bookStore.currentBook) return

  const { lines, currentLine } = bookStore.currentBook
  const maxChars = charsPerLine.value

  if (charOffset.value >= maxChars) {
    // 当前行内往回滚
    charOffset.value -= maxChars
  } else if (currentLine > 0) {
    // 移动到上一行的末尾
    bookStore.prevPage(1)
    const prevLine = lines[currentLine - 1] || ''
    // 计算上一行最后一个视觉行的起始位置
    const visualLines = Math.ceil(prevLine.length / maxChars)
    charOffset.value = Math.max(0, (visualLines - 1) * maxChars)
  } else {
    charOffset.value = 0
  }
}

// 进度百分比
const progressPercent = computed(() => {
  if (!bookStore.currentBook) return 0
  return Math.round((bookStore.currentBook.currentLine / bookStore.currentBook.totalLines) * 100)
})

// 进度条拖动
function handleProgressChange(e: Event) {
  const target = e.target as HTMLInputElement
  const line = parseInt(target.value)
  bookStore.goToLine(line)
}

function handleClick(e: MouseEvent) {
  if (!settingsStore.settings.clickToNextPage) return
  if (e.button === 0) {
    bookStore.nextPage(settingsStore.settings.displayLines)
  }
}

function handleWheel(e: WheelEvent) {
  e.preventDefault()
  if (e.deltaY > 0) {
    scrollDown()
  } else {
    scrollUp()
  }
}

function handleKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown':
    case 'j':
    case ' ':
      scrollDown()
      break
    case 'ArrowUp':
    case 'k':
      scrollUp()
      break
    case 'PageDown':
      // 翻页：滚动 displayLines 个视觉行
      for (let i = 0; i < settingsStore.settings.displayLines; i++) {
        scrollDown()
      }
      break
    case 'PageUp':
      for (let i = 0; i < settingsStore.settings.displayLines; i++) {
        scrollUp()
      }
      break
    case 'Home':
      charOffset.value = 0
      bookStore.goToLine(0)
      break
    case 'End':
      charOffset.value = 0
      bookStore.goToLine(bookStore.currentBook?.totalLines || 0)
      break
  }
}

function startAutoScroll() {
  if (autoScrollTimer) return
  autoScrollTimer = setInterval(() => {
    bookStore.nextPage(settingsStore.settings.displayLines)
  }, settingsStore.settings.autoScrollInterval * 1000)
}

function stopAutoScroll() {
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer)
    autoScrollTimer = null
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleResize)

  // 初始化宽度
  if (readerRef.value) {
    containerWidth.value = readerRef.value.clientWidth - 24
  }

  if (settingsStore.settings.autoScroll) {
    startAutoScroll()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleResize)
  stopAutoScroll()
  if (resizeTimer) clearTimeout(resizeTimer)
})

// 监听窗口可见性，暂停/恢复计时
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    statisticsStore.pauseReading()
    stopAutoScroll()
  } else {
    if (bookStore.currentBook) {
      statisticsStore.resumeReading()
      if (settingsStore.settings.autoScroll) {
        startAutoScroll()
      }
    }
  }
})
</script>

<template>
  <div
    ref="readerRef"
    class="reader"
    @click="handleClick"
    @wheel="handleWheel"
    tabindex="0"
  >
    <div class="content">
      <div
        v-for="(line, index) in displayedLines"
        :key="index"
        class="line"
        :style="{
          color: settingsStore.settings.textColor,
          textAlign: settingsStore.settings.textAlign
        }"
      >
        {{ line || '\u00A0' }}
      </div>
    </div>

    <!-- 进度条 (悬浮显示) -->
    <div class="progress-bar-container" v-if="bookStore.currentBook">
      <input
        type="range"
        class="progress-bar"
        min="0"
        :max="bookStore.currentBook.totalLines - 1"
        :value="bookStore.currentBook.currentLine"
        @input="handleProgressChange"
        @mousedown.stop
      />
      <span class="progress-text">{{ progressPercent }}%</span>
    </div>
  </div>
</template>

<style scoped>
.reader {
  flex: 1;
  padding: 8px 12px;
  cursor: default;
  outline: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.content {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.line {
  line-height: 1.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 进度条容器 - 默认隐藏，悬浮显示 */
.progress-bar-container {
  position: absolute;
  bottom: 6px;
  left: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px;
}

.reader:hover .progress-bar-container {
  opacity: 1;
}

.progress-bar {
  flex: 1;
  height: 3px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  cursor: pointer;
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
  background: #666;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.progress-bar::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.progress-bar::-webkit-slider-runnable-track {
  height: 3px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 2px;
}

.progress-text {
  font-size: 10px;
  font-weight: 500;
  color: #888;
  min-width: 28px;
  text-align: right;
}
</style>
