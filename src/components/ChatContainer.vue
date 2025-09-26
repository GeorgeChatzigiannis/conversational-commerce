<template>
  <div :class="$style.container">
    <header :class="$style.header">
      <div :class="$style.titleRow">
        <OnLogo :width="60" :class="$style.logo" />
        <h1 :class="$style.title">Assistant</h1>
      </div>
    </header>

    <MessageList :class="$style.messageList" />

    <div :class="$style.inputContainer">
      <MessageInput />
    </div>
  </div>
</template>

<script setup lang="ts">
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'
import OnLogo from './OnLogo.vue'
</script>

<style module src="./ChatContainer.module.css"></style>
