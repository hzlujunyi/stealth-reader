<script setup lang="ts">
import { useBookStore } from '../stores/book'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const bookStore = useBookStore()

function handleChapterClick(index: number) {
  bookStore.goToChapter(index)
  emit('close')
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}
</script>

<template>
  <div class="overlay" @click="handleOverlayClick">
    <div class="panel">
      <div class="header">
        <h3>目录</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="content">
        <div v-if="!bookStore.currentBook" class="empty">
          请先打开书籍
        </div>
        <div v-else-if="bookStore.currentBook.chapters.length === 0" class="empty">
          未识别到章节目录
        </div>
        <ul v-else>
          <li
            v-for="(chapter, index) in bookStore.currentBook.chapters"
            :key="index"
            @click="handleChapterClick(index)"
            :class="{ active: bookStore.currentBook.currentLine >= chapter.lineIndex }"
          >
            {{ chapter.title }}
          </li>
        </ul>
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
  width: 320px;
  max-height: 420px;
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
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.content::-webkit-scrollbar {
  width: 4px;
}

.content::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.empty {
  padding: 24px 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

li {
  padding: 10px 20px;
  cursor: pointer;
  font-size: 13px;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-left: 2px solid transparent;
}

li:hover {
  background: #f9f9f9;
  border-left-color: #999;
}

li.active {
  color: #333;
  background: #f5f5f5;
  border-left-color: #666;
  font-weight: 500;
}
</style>
