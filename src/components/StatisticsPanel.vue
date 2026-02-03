<script setup lang="ts">
import { computed } from 'vue'
import { useStatisticsStore } from '../stores/statistics'
import { useBookStore } from '../stores/book'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const statisticsStore = useStatisticsStore()
const bookStore = useBookStore()

const bookStats = computed(() => {
  return bookStore.books.map(book => ({
    ...book,
    readingTime: statisticsStore.getBookTime(book.id)
  }))
})

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
        <h3>阅读统计</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="content">
        <div class="summary">
          <div class="stat-item">
            <div class="label">今日阅读</div>
            <div class="value">{{ statisticsStore.formattedTodayTime }}</div>
          </div>
          <div class="stat-item">
            <div class="label">累计阅读</div>
            <div class="value">{{ statisticsStore.formattedTotalTime }}</div>
          </div>
        </div>

        <div class="book-list" v-if="bookStats.length > 0">
          <h4>书籍统计</h4>
          <ul>
            <li v-for="book in bookStats" :key="book.id">
              <span class="book-name">{{ book.name }}</span>
              <span class="book-time">{{ book.readingTime }}</span>
            </li>
          </ul>
        </div>

        <div class="progress-section" v-if="bookStore.currentBook">
          <h4>当前进度</h4>
          <div class="progress-info">
            <span>{{ bookStore.currentBook.name }}</span>
            <span>{{ bookStore.progress }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: bookStore.progress + '%' }"></div>
          </div>
          <div class="progress-detail">
            第 {{ bookStore.currentBook.currentLine + 1 }} 行 / 共 {{ bookStore.currentBook.totalLines }} 行
          </div>
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
  width: 340px;
  max-height: 480px;
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

.summary {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 14px 12px;
  background: #f9f9f9;
  border-radius: 4px;
}

.stat-item .label {
  font-size: 11px;
  color: #999;
  margin-bottom: 6px;
}

.stat-item .value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.book-list h4,
.progress-section h4 {
  font-size: 11px;
  color: #999;
  margin: 0 0 12px 0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.book-list ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.book-list li {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.book-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 12px;
  color: #555;
}

.book-time {
  color: #999;
  font-size: 12px;
}

.progress-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 8px;
  color: #555;
}

.progress-info span:last-child {
  font-weight: 500;
  color: #333;
}

.progress-bar {
  height: 6px;
  background: #e5e5e5;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #666;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-detail {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: center;
}
</style>
