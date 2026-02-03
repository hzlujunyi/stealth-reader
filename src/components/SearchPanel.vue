<script setup lang="ts">
import { ref } from 'vue'
import { useBookStore } from '../stores/book'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const bookStore = useBookStore()
const keyword = ref('')
const results = ref<{ line: number; text: string }[]>([])

function handleSearch() {
  if (!keyword.value.trim()) {
    results.value = []
    return
  }
  results.value = bookStore.searchText(keyword.value)
}

function handleResultClick(line: number) {
  bookStore.goToLine(line)
  emit('close')
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

function highlightText(text: string): string {
  if (!keyword.value) return text
  const regex = new RegExp(`(${keyword.value})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}
</script>

<template>
  <div class="overlay" @click="handleOverlayClick">
    <div class="panel">
      <div class="header">
        <h3>查找</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="search-box">
        <input
          v-model="keyword"
          type="text"
          placeholder="输入关键词"
          @keyup.enter="handleSearch"
          autofocus
        />
        <button @click="handleSearch">搜索</button>
      </div>

      <div class="results">
        <div v-if="!bookStore.currentBook" class="empty">
          请先打开书籍
        </div>
        <div v-else-if="keyword && results.length === 0" class="empty">
          未找到匹配内容
        </div>
        <div v-else-if="results.length > 0" class="result-info">
          找到 {{ results.length }} 处匹配
        </div>
        <ul v-if="results.length > 0">
          <li
            v-for="result in results.slice(0, 100)"
            :key="result.line"
            @click="handleResultClick(result.line)"
          >
            <span class="line-num">行 {{ result.line + 1 }}</span>
            <span class="text" v-html="highlightText(result.text)"></span>
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
  width: 380px;
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

.search-box {
  display: flex;
  padding: 16px 20px;
  gap: 10px;
  border-bottom: 1px solid #eee;
}

.search-box input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.search-box input:focus {
  border-color: #999;
}

.search-box button {
  padding: 8px 16px;
  background: #f5f5f5;
  color: #555;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.search-box button:hover {
  background: #eee;
}

.results {
  flex: 1;
  overflow-y: auto;
}

.results::-webkit-scrollbar {
  width: 4px;
}

.results::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.empty {
  padding: 24px 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.result-info {
  padding: 10px 20px;
  color: #999;
  font-size: 12px;
  background: #f9f9f9;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

li {
  padding: 10px 20px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
}

li:hover {
  background: #f9f9f9;
}

.line-num {
  color: #999;
  font-size: 11px;
  white-space: nowrap;
}

.text {
  flex: 1;
  font-size: 13px;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(mark) {
  background: #fff3cd;
  padding: 1px 2px;
  border-radius: 2px;
}
</style>
