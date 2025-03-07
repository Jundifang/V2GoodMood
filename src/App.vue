<template>
  <div id="app" :class="{ 'dark-mode': isDarkMode }">
    <div class="main-content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'App',
  setup() {
    const isDarkMode = ref(false)

    const toggleTheme = () => {
      document.body.classList.toggle('dark-mode')
    }

    return {
      isDarkMode,
      toggleTheme
    }
  }
}
</script>

<style>
/* 全局样式 */
:root {
  --primary-color: #2c3e50;
  --secondary-color: #42b983;
  --background-color: #ffffff;
  --text-color: #2c3e50;
}

/* 暗黑模式变量 */
.dark-mode {
  --primary-color: #42b983;
  --secondary-color: #2c3e50;
  --background-color: #1a1a1a;
  --text-color: #ffffff;
}

#app {
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
}

.main-content {
  background-color: var(--background-color);
  color: var(--text-color);
  min-height: 100vh;
}
</style>