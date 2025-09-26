<template>
  <div id="app" :class="$style.app">
    <ChatContainer />
  </div>
</template>

<script setup lang="ts">
import ChatContainer from './components/ChatContainer.vue'
</script>

<style module src="./App.module.css"></style>
