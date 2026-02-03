import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Statistics } from '../types'

export const useStatisticsStore = defineStore('statistics', () => {
  const statistics = ref<Statistics>({
    todayReadingTime: 0,
    totalReadingTime: 0,
    bookReadingTime: {},
    lastReadDate: ''
  })

  let readingTimer: ReturnType<typeof setInterval> | null = null
  let currentReadingBookId: string | null = null

  const formattedTodayTime = computed(() => formatTime(statistics.value.todayReadingTime))
  const formattedTotalTime = computed(() => formatTime(statistics.value.totalReadingTime))

  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    } else if (minutes > 0) {
      return `${minutes}分钟${secs}秒`
    } else {
      return `${secs}秒`
    }
  }

  function getBookTime(bookId: string): string {
    const seconds = statistics.value.bookReadingTime[bookId] || 0
    return formatTime(seconds)
  }

  async function loadStatistics() {
    const saved = await window.electronAPI.getStore('statistics')
    if (saved) {
      statistics.value = saved

      // 检查是否新的一天，重置今日时长
      const today = new Date().toDateString()
      if (statistics.value.lastReadDate !== today) {
        statistics.value.todayReadingTime = 0
        statistics.value.lastReadDate = today
      }
    }
  }

  async function saveStatistics() {
    await window.electronAPI.setStore('statistics', statistics.value)
  }

  function startReading(bookId: string) {
    stopReading()
    currentReadingBookId = bookId

    // 每秒更新统计
    readingTimer = setInterval(() => {
      statistics.value.todayReadingTime++
      statistics.value.totalReadingTime++

      if (currentReadingBookId) {
        if (!statistics.value.bookReadingTime[currentReadingBookId]) {
          statistics.value.bookReadingTime[currentReadingBookId] = 0
        }
        statistics.value.bookReadingTime[currentReadingBookId]++
      }

      statistics.value.lastReadDate = new Date().toDateString()

      // 每30秒保存一次
      if (statistics.value.todayReadingTime % 30 === 0) {
        saveStatistics()
      }
    }, 1000)
  }

  function stopReading() {
    if (readingTimer) {
      clearInterval(readingTimer)
      readingTimer = null
    }
    currentReadingBookId = null
    saveStatistics()
  }

  function pauseReading() {
    if (readingTimer) {
      clearInterval(readingTimer)
      readingTimer = null
    }
  }

  function resumeReading() {
    if (currentReadingBookId && !readingTimer) {
      startReading(currentReadingBookId)
    }
  }

  return {
    statistics,
    formattedTodayTime,
    formattedTotalTime,
    getBookTime,
    loadStatistics,
    saveStatistics,
    startReading,
    stopReading,
    pauseReading,
    resumeReading
  }
})
