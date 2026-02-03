import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Settings } from '../types'

const defaultSettings: Settings = {
  displayLines: 2,
  fontSize: 14,
  fontFamily: 'Microsoft YaHei',
  textColor: '#333333',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  textAlign: 'left',
  opacity: 90,
  frameless: true,
  alwaysOnTop: true,
  autoHideOnMouseLeave: true,
  clickToNextPage: true,
  autoScroll: false,
  autoScrollInterval: 5,
  windowWidth: 600,
  windowHeight: 80
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({ ...defaultSettings })
  const loaded = ref(false)

  async function loadSettings() {
    const saved = await window.electronAPI.getStore('settings')
    if (saved) {
      settings.value = { ...defaultSettings, ...saved }
    }
    loaded.value = true
  }

  async function saveSettings() {
    await window.electronAPI.setStore('settings', settings.value)
  }

  async function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    settings.value[key] = value
    await saveSettings()

    // 特殊处理某些设置
    if (key === 'opacity') {
      await window.electronAPI.setOpacity(value as number)
    } else if (key === 'alwaysOnTop') {
      await window.electronAPI.setAlwaysOnTop(value as boolean)
    } else if (key === 'autoHideOnMouseLeave') {
      await window.electronAPI.setAutoHide(value as boolean)
    }
  }

  function resetSettings() {
    settings.value = { ...defaultSettings }
    saveSettings()
  }

  return {
    settings,
    loaded,
    loadSettings,
    saveSettings,
    updateSetting,
    resetSettings
  }
})
