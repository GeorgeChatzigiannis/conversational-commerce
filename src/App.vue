<template>
  <div id="app" :class="$style.app">
    <ChatContainer />
  </div>
</template>

<script setup lang="ts">
import ChatContainer from './components/ChatContainer.vue'
</script>

<style module>
.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background);
  padding: var(--spacing-lg);
}

@media (max-width: 768px) {
  .app {
    padding: 0;
    height: 100vh;
    height: 100dvh; /* Dynamic viewport height */
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}
</style>
