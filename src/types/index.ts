export interface Book {
  id: string
  path: string
  name: string
  addedAt: number
}

export interface Chapter {
  title: string
  lineIndex: number
}

export interface CurrentBook {
  id: string
  path: string
  name: string
  lines: string[]
  chapters: Chapter[]
  currentLine: number
  totalLines: number
}

export interface Settings {
  displayLines: number
  fontSize: number
  fontFamily: string
  textColor: string
  backgroundColor: string
  textAlign: 'left' | 'center' | 'right'
  opacity: number
  frameless: boolean
  alwaysOnTop: boolean
  autoHideOnMouseLeave: boolean
  clickToNextPage: boolean
  autoScroll: boolean
  autoScrollInterval: number
  windowWidth: number
  windowHeight: number
}

export interface Statistics {
  todayReadingTime: number
  totalReadingTime: number
  bookReadingTime: Record<string, number>
  lastReadDate: string
}

export interface ReadingProgress {
  [bookId: string]: {
    line: number
    lastRead: string
  }
}
