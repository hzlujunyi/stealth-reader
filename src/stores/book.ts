import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Book, CurrentBook, Chapter, ReadingProgress } from '../types'
import { useStatisticsStore } from './statistics'

// 章节标题正则
const chapterPatterns = [
  /^第[一二三四五六七八九十百千万零\d]+[章节回卷部篇集]/,
  /^[第]?\s*\d+[、.\s]\s*.+/,
  /^Chapter\s+\d+/i,
  /^CHAPTER\s+\d+/i,
  /^卷[一二三四五六七八九十百千万零\d]+/,
  /^[一二三四五六七八九十]+[、.]\s*.+/
]

function parseChapters(lines: string[]): Chapter[] {
  const chapters: Chapter[] = []
  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    if (trimmedLine.length > 0 && trimmedLine.length < 50) {
      for (const pattern of chapterPatterns) {
        if (pattern.test(trimmedLine)) {
          chapters.push({
            title: trimmedLine,
            lineIndex: index
          })
          break
        }
      }
    }
  })
  return chapters
}

function generateBookId(path: string): string {
  return btoa(encodeURIComponent(path)).replace(/[/+=]/g, '')
}

export const useBookStore = defineStore('book', () => {
  const books = ref<Book[]>([])
  const currentBook = ref<CurrentBook | null>(null)
  const readingProgress = ref<ReadingProgress>({})

  const currentLines = computed(() => {
    if (!currentBook.value) return []
    const { lines, currentLine } = currentBook.value
    return lines.slice(currentLine)
  })

  const progress = computed(() => {
    if (!currentBook.value) return 0
    return Math.round((currentBook.value.currentLine / currentBook.value.totalLines) * 100)
  })

  async function loadData() {
    const savedBooks = await window.electronAPI.getStore('books')
    const savedProgress = await window.electronAPI.getStore('readingProgress')
    if (savedBooks) books.value = savedBooks
    if (savedProgress) readingProgress.value = savedProgress
  }

  async function saveData() {
    await window.electronAPI.setStore('books', books.value)
    await window.electronAPI.setStore('readingProgress', readingProgress.value)
  }

  async function openFile() {
    const result = await window.electronAPI.openFile()
    if (!result) return false

    const { path, name, content } = result
    const lines = content.split(/\r?\n/)
    const chapters = parseChapters(lines)
    const bookId = generateBookId(path)

    // 添加到书架
    if (!books.value.find(b => b.id === bookId)) {
      books.value.push({
        id: bookId,
        path,
        name: name || 'Unknown',
        addedAt: Date.now()
      })
    }

    // 恢复阅读进度
    const savedLine = readingProgress.value[bookId]?.line || 0

    currentBook.value = {
      id: bookId,
      path,
      name: name || 'Unknown',
      lines,
      chapters,
      currentLine: savedLine,
      totalLines: lines.length
    }

    await saveData()

    // 开始计时
    const statisticsStore = useStatisticsStore()
    statisticsStore.startReading(bookId)

    return true
  }

  function nextPage(lineCount: number = 1) {
    if (!currentBook.value) return
    const newLine = Math.min(
      currentBook.value.currentLine + lineCount,
      currentBook.value.totalLines - 1
    )
    currentBook.value.currentLine = newLine
    saveProgress()
  }

  function prevPage(lineCount: number = 1) {
    if (!currentBook.value) return
    const newLine = Math.max(currentBook.value.currentLine - lineCount, 0)
    currentBook.value.currentLine = newLine
    saveProgress()
  }

  function goToLine(line: number) {
    if (!currentBook.value) return
    currentBook.value.currentLine = Math.max(0, Math.min(line, currentBook.value.totalLines - 1))
    saveProgress()
  }

  function goToChapter(chapterIndex: number) {
    if (!currentBook.value) return
    const chapter = currentBook.value.chapters[chapterIndex]
    if (chapter) {
      goToLine(chapter.lineIndex)
    }
  }

  function saveProgress() {
    if (!currentBook.value) return
    readingProgress.value[currentBook.value.id] = {
      line: currentBook.value.currentLine,
      lastRead: new Date().toISOString()
    }
    saveData()
  }

  function searchText(keyword: string): { line: number; text: string }[] {
    if (!currentBook.value || !keyword) return []
    const results: { line: number; text: string }[] = []
    currentBook.value.lines.forEach((line, index) => {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        results.push({ line: index, text: line })
      }
    })
    return results
  }

  function closeBook() {
    const statisticsStore = useStatisticsStore()
    statisticsStore.stopReading()
    currentBook.value = null
  }

  return {
    books,
    currentBook,
    currentLines,
    progress,
    loadData,
    openFile,
    nextPage,
    prevPage,
    goToLine,
    goToChapter,
    searchText,
    closeBook
  }
})
