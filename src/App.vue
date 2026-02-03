<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useSettingsStore } from './stores/settings'
import { useBookStore } from './stores/book'
import { useStatisticsStore } from './stores/statistics'
import Reader from './components/Reader.vue'
import Settings from './components/Settings.vue'
import TableOfContents from './components/TableOfContents.vue'
import SearchPanel from './components/SearchPanel.vue'
import StatisticsPanel from './components/StatisticsPanel.vue'
import WelcomeScreen from './components/WelcomeScreen.vue'

const settingsStore = useSettingsStore()
const bookStore = useBookStore()
const statisticsStore = useStatisticsStore()

const showSettings = ref(false)
const showToc = ref(false)
const showSearch = ref(false)
const showStatistics = ref(false)

// 保存原始窗口大小
let originalBounds: { width: number; height: number } | null = null

// 右键拖动移动窗口
let isDragging = false
let hasDragged = false  // 是否实际发生了拖动（用于阻止拖动后弹出菜单）
let lastMouseX = 0
let lastMouseY = 0

// 是否应该暂停自动隐藏（没有书籍或有弹窗打开时）
const shouldPauseAutoHide = computed(() => {
  return !bookStore.currentBook || showSettings.value || showToc.value || showSearch.value || showStatistics.value
})

// 监听状态变化，通知主进程
watch(shouldPauseAutoHide, (paused) => {
  window.electronAPI?.pauseAutoHide(paused)
})

// 打开弹窗时放大窗口
async function openPopup(type: 'settings' | 'toc' | 'search' | 'statistics') {
  if (window.electronAPI) {
    const bounds = await window.electronAPI.getWindowBounds()
    if (bounds && !originalBounds) {
      originalBounds = { width: bounds.width, height: bounds.height }
    }
    await window.electronAPI.setWindowBounds({ width: 450, height: 550 })
  }

  if (type === 'settings') showSettings.value = true
  else if (type === 'toc') showToc.value = true
  else if (type === 'search') showSearch.value = true
  else if (type === 'statistics') showStatistics.value = true
}

// 关闭弹窗时恢复窗口大小
async function closePopup(type: 'settings' | 'toc' | 'search' | 'statistics') {
  if (type === 'settings') showSettings.value = false
  else if (type === 'toc') showToc.value = false
  else if (type === 'search') showSearch.value = false
  else if (type === 'statistics') showStatistics.value = false

  // 检查是否还有其他弹窗打开
  const hasOtherPopup = showSettings.value || showToc.value || showSearch.value || showStatistics.value

  if (!hasOtherPopup && originalBounds && window.electronAPI) {
    await window.electronAPI.setWindowBounds(originalBounds)
    originalBounds = null
  }
}

onMounted(async () => {
  console.log('App mounted')
  console.log('electronAPI available:', !!window.electronAPI)

  if (!window.electronAPI) {
    console.error('electronAPI is not available! Preload script may have failed to load.')
    return
  }

  try {
    await settingsStore.loadSettings()
    await bookStore.loadData()
    await statisticsStore.loadStatistics()
    console.log('Stores loaded successfully')

    // 初始化自动隐藏状态（没有书籍时暂停）
    window.electronAPI.pauseAutoHide(shouldPauseAutoHide.value)

    // 监听菜单事件
    window.electronAPI.onMenuOpenFile(() => {
      console.log('Menu: Open file triggered')
      bookStore.openFile()
    })
    window.electronAPI.onMenuShowToc(() => {
      console.log('Menu: Show TOC triggered')
      openPopup('toc')
    })
    window.electronAPI.onMenuShowSearch(() => {
      console.log('Menu: Show search triggered')
      openPopup('search')
    })
    window.electronAPI.onMenuShowSettings(() => {
      console.log('Menu: Show settings triggered')
      openPopup('settings')
    })
    window.electronAPI.onMenuShowStatistics(() => {
      console.log('Menu: Show statistics triggered')
      openPopup('statistics')
    })
  } catch (err) {
    console.error('Error during initialization:', err)
  }
})

function handleContextMenu(e: MouseEvent) {
  e.preventDefault()
  // 如果正在拖动或刚刚拖动过，不显示菜单
  if (isDragging || hasDragged) {
    hasDragged = false  // 重置标志
    return
  }

  console.log('Context menu triggered')
  if (window.electronAPI) {
    window.electronAPI.showContextMenu()
  } else {
    console.error('electronAPI not available for context menu')
  }
}

// 鼠标移动时移动窗口 (document级别)
function onDocumentMouseMove(e: MouseEvent) {
  if (!isDragging) return

  const deltaX = e.screenX - lastMouseX
  const deltaY = e.screenY - lastMouseY

  if (window.electronAPI && (deltaX !== 0 || deltaY !== 0)) {
    hasDragged = true  // 标记发生了实际拖动
    window.electronAPI.moveWindow(deltaX, deltaY)
    lastMouseX = e.screenX
    lastMouseY = e.screenY
  }
}

// 鼠标松开停止拖动 (document级别)
function onDocumentMouseUp(e: MouseEvent) {
  if (e.button === 2 && isDragging) {
    isDragging = false
    document.removeEventListener('mousemove', onDocumentMouseMove)
    document.removeEventListener('mouseup', onDocumentMouseUp)
  }
}

// 右键按下开始拖动
function handleMouseDown(e: MouseEvent) {
  if (e.button === 2) { // 右键
    isDragging = true
    hasDragged = false  // 重置拖动标志
    lastMouseX = e.screenX
    lastMouseY = e.screenY
    // 添加document级别的事件监听，确保拖动流畅
    document.addEventListener('mousemove', onDocumentMouseMove)
    document.addEventListener('mouseup', onDocumentMouseUp)
    e.preventDefault()
  }
}

// 这两个不再需要，但保留空函数以兼容模板
function handleMouseMove(_e: MouseEvent) {}
function handleMouseUp(_e: MouseEvent) {}
</script>

<template>
  <div
    class="app"
    @contextmenu="handleContextMenu"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    :style="{
      backgroundColor: settingsStore.settings.backgroundColor,
      fontSize: settingsStore.settings.fontSize + 'px',
      fontFamily: settingsStore.settings.fontFamily
    }"
  >
    <!-- 左侧装饰条 - 右键拖动可移动窗口 -->
    <div class="drag-handle" title="右键拖动移动窗口">
      <span class="drag-dots">⋮⋮</span>
    </div>

    <div class="main-content">
      <Reader v-if="bookStore.currentBook" />
      <WelcomeScreen v-else @open-file="bookStore.openFile" />
    </div>

    <!-- 弹窗 -->
    <Settings v-if="showSettings" @close="closePopup('settings')" />
    <TableOfContents v-if="showToc" @close="closePopup('toc')" />
    <SearchPanel v-if="showSearch" @close="closePopup('search')" />
    <StatisticsPanel v-if="showStatistics" @close="closePopup('statistics')" />
  </div>
</template>

<style scoped>
.app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  border-radius: 6px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 左侧装饰条 - 极简设计 */
.drag-handle {
  width: 3px;
  min-width: 3px;
  height: 100%;
  background: rgba(0, 0, 0, 0.04);
  cursor: default;
  flex-shrink: 0;
}

.drag-handle:hover {
  background: rgba(0, 0, 0, 0.08);
}

.drag-dots {
  display: none;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
