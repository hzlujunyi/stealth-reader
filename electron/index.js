const { app, BrowserWindow, ipcMain, dialog, Menu, screen, desktopCapturer, Tray, nativeImage } = require('electron')
const { join } = require('path')
const fs = require('fs')

let Store
let store
let mainWindow = null
let tray = null
let isMouseInWindow = false
let mouseCheckInterval = null
let isMenuOpen = false  // 菜单打开时暂停自动隐藏
let isAutoHidePaused = true  // 暂停自动隐藏（默认暂停，等渲染进程通知）
let isAutoHideEnabled = true  // 本地追踪自动隐藏状态（避免每次从store读取）

function getStore() {
  if (!store) {
    Store = require('electron-store')
    store = new Store()
  }
  return store
}

function createTray() {
  // 创建托盘图标 - 根据平台选择不同格式
  let iconPath
  if (process.platform === 'darwin') {
    // macOS 使用 PNG 模板图标（16x16 或 22x22）
    iconPath = join(__dirname, '../public/iconTemplate.png')
    // 如果没有模板图标，尝试使用普通 PNG
    if (!fs.existsSync(iconPath)) {
      iconPath = join(__dirname, '../public/icon.png')
    }
  } else {
    // Windows 使用 ICO 图标
    iconPath = join(__dirname, '../public/icon.ico')
  }

  let trayIcon
  try {
    trayIcon = nativeImage.createFromPath(iconPath)
    if (trayIcon.isEmpty()) {
      // 如果图标加载失败，创建一个简单的灰色图标
      trayIcon = nativeImage.createEmpty()
    }
    // macOS 模板图标设置
    if (process.platform === 'darwin') {
      trayIcon.setTemplateImage(true)
    }
  } catch (e) {
    trayIcon = nativeImage.createEmpty()
  }

  tray = new Tray(trayIcon)
  tray.setToolTip('StealthReader')

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示窗口', click: () => mainWindow && mainWindow.show() },
    { label: '隐藏窗口', click: () => mainWindow && mainWindow.hide() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ])

  tray.setContextMenu(contextMenu)

  // 点击托盘图标切换窗口显示/隐藏
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
      }
    }
  })
}

function createWindow() {
  const storeInstance = getStore()
  const settings = storeInstance.get('settings', {
    opacity: 100,
    frameless: true,
    alwaysOnTop: true,
    autoHideOnMouseLeave: true,
    windowWidth: 600,
    windowHeight: 80
  })

  mainWindow = new BrowserWindow({
    width: settings.windowWidth || 600,
    height: settings.windowHeight || 80,
    frame: !settings.frameless,
    transparent: true,
    alwaysOnTop: settings.alwaysOnTop,
    resizable: true,
    skipTaskbar: true,  // 不在任务栏显示
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.setOpacity(settings.opacity / 100)

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 初始化自动隐藏状态（从设置读取，默认true）
  isAutoHideEnabled = settings.autoHideOnMouseLeave !== false

  if (isAutoHideEnabled) {
    startMouseTracking()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    if (mouseCheckInterval) {
      clearInterval(mouseCheckInterval)
    }
  })
}

function startMouseTracking() {
  // 如果自动隐藏被禁用，不启动追踪
  if (!isAutoHideEnabled) {
    return
  }

  if (mouseCheckInterval) {
    clearInterval(mouseCheckInterval)
  }

  mouseCheckInterval = setInterval(() => {
    if (!mainWindow) return

    // 双重检查：如果自动隐藏被禁用，停止追踪
    if (!isAutoHideEnabled) {
      stopMouseTracking()
      return
    }

    const point = screen.getCursorScreenPoint()
    const bounds = mainWindow.getBounds()

    const isInside = point.x >= bounds.x &&
                     point.x <= bounds.x + bounds.width &&
                     point.y >= bounds.y &&
                     point.y <= bounds.y + bounds.height

    if (isInside) {
      // 鼠标在窗口内，显示窗口
      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }
    } else if (mainWindow.isVisible() && !isMenuOpen && !isAutoHidePaused) {
      // 鼠标在窗口外且菜单未打开且未暂停，隐藏窗口
      mainWindow.hide()
    }
  }, 100)
}

function stopMouseTracking() {
  if (mouseCheckInterval) {
    clearInterval(mouseCheckInterval)
    mouseCheckInterval = null
  }
}

function setupIPC() {
  const jschardet = require('jschardet')
  const iconv = require('iconv-lite')

  ipcMain.handle('open-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Text Files', extensions: ['txt'] }]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const filePath = result.filePaths[0]
    const buffer = fs.readFileSync(filePath)

    const detected = jschardet.detect(buffer)
    const encoding = detected.encoding || 'utf-8'

    let content
    if (encoding.toLowerCase().includes('utf-8') || encoding.toLowerCase().includes('ascii')) {
      content = buffer.toString('utf-8')
    } else {
      content = iconv.decode(buffer, encoding)
    }

    return {
      path: filePath,
      name: filePath.split(/[\\/]/).pop(),
      content: content
    }
  })

  ipcMain.handle('get-store', (_, key) => {
    return getStore().get(key)
  })

  ipcMain.handle('set-store', (_, key, value) => {
    getStore().set(key, value)
  })

  ipcMain.handle('set-opacity', (_, opacity) => {
    if (mainWindow) {
      mainWindow.setOpacity(opacity / 100)
    }
  })

  ipcMain.handle('set-always-on-top', (_, value) => {
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(value)
    }
  })

  ipcMain.handle('set-frameless', (_, value) => {
    getStore().set('settings.frameless', value)
  })

  ipcMain.handle('set-auto-hide', (_, value) => {
    isAutoHideEnabled = value
    getStore().set('settings.autoHideOnMouseLeave', value)

    if (value) {
      startMouseTracking()
    } else {
      stopMouseTracking()
      if (mainWindow) {
        mainWindow.show()
      }
    }
  })

  ipcMain.handle('show-window', () => {
    if (mainWindow) {
      mainWindow.show()
    }
  })

  ipcMain.handle('hide-window', () => {
    if (mainWindow) {
      mainWindow.hide()
    }
  })

  ipcMain.handle('minimize-window', () => {
    if (mainWindow) {
      mainWindow.minimize()
    }
  })

  ipcMain.handle('restore-window', () => {
    if (mainWindow) {
      mainWindow.restore()
    }
  })

  ipcMain.handle('get-window-bounds', () => {
    if (mainWindow) {
      return mainWindow.getBounds()
    }
    return null
  })

  ipcMain.handle('set-window-bounds', (_, bounds) => {
    if (mainWindow) {
      const current = mainWindow.getBounds()
      mainWindow.setBounds({
        ...current,
        ...bounds
      })
    }
  })

  ipcMain.handle('move-window', (_, deltaX, deltaY) => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      mainWindow.setPosition(bounds.x + deltaX, bounds.y + deltaY)
    }
  })

  ipcMain.handle('pause-auto-hide', (_, paused) => {
    isAutoHidePaused = paused
  })

  // 切换自动隐藏功能
  ipcMain.handle('toggle-auto-hide', (_, enabled) => {
    isAutoHideEnabled = enabled
    getStore().set('settings.autoHideOnMouseLeave', enabled)

    if (enabled) {
      startMouseTracking()
    } else {
      stopMouseTracking()
      if (mainWindow) {
        mainWindow.show()
      }
    }
  })

  // 截取全屏用于取色
  ipcMain.handle('capture-screen', async () => {
    try {
      const primaryDisplay = screen.getPrimaryDisplay()
      const { width, height } = primaryDisplay.size

      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width, height }
      })

      if (sources.length > 0) {
        // 返回截图的 data URL
        return sources[0].thumbnail.toDataURL()
      }
      return null
    } catch (error) {
      console.error('Failed to capture screen:', error)
      return null
    }
  })

  ipcMain.handle('show-context-menu', () => {
    const menu = Menu.buildFromTemplate([
      { label: '打开书籍', click: () => mainWindow && mainWindow.webContents.send('menu-open-file') },
      { label: '目录', click: () => mainWindow && mainWindow.webContents.send('menu-show-toc') },
      { label: '查找', click: () => mainWindow && mainWindow.webContents.send('menu-show-search') },
      { type: 'separator' },
      { label: '设置', click: () => mainWindow && mainWindow.webContents.send('menu-show-settings') },
      { label: '阅读统计', click: () => mainWindow && mainWindow.webContents.send('menu-show-statistics') },
      { type: 'separator' },
      { label: '退出', click: () => app.quit() }
    ])
    // 菜单打开时暂停自动隐藏
    isMenuOpen = true
    menu.popup({
      callback: () => {
        // 菜单关闭后恢复自动隐藏
        isMenuOpen = false
      }
    })
  })
}

// 禁用 GPU 缓存，避免 Windows 上的权限错误
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

app.whenReady().then(() => {
  setupIPC()
  createWindow()
  createTray()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (tray) {
      tray.destroy()
      tray = null
    }
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
