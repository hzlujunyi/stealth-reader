<script setup lang="ts">
defineEmits<{
  (e: 'open-file'): void
}>()
</script>

<template>
  <div class="welcome">
    <div class="hints">
      <div class="hint-main">点击此处打开书籍</div>
      <div class="hint-tips">
        <span>右键点击 → 菜单</span>
        <span>右键拖动 → 移动窗口</span>
        <span>滚轮 → 翻页</span>
      </div>
    </div>
    <div class="click-area" @click="$emit('open-file')"></div>
  </div>
</template>

<style scoped>
.welcome {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.hints {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  pointer-events: none;
}

.hint-main {
  color: #999;
  font-size: 13px;
  font-weight: 400;
}

.hint-tips {
  display: flex;
  gap: 12px;
  color: #bbb;
  font-size: 10px;
}

.hint-tips span {
  white-space: nowrap;
}

.click-area {
  position: absolute;
  inset: 0;
  cursor: pointer;
}

.click-area:hover ~ .hints .hint-main {
  color: #475569;
}
</style>
