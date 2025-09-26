<template>
  <form :class="$style.form" @submit.prevent="handleSubmit">
    <div :class="$style.inputWrapper">
      <textarea
        ref="textareaRef"
        v-model="message"
        :class="$style.input"
        :placeholder="placeholder"
        :disabled="isLoading"
        rows="1"
        @keydown.enter.prevent="handleEnterKey"
        @input="handleInput"
      />

      <button
        :class="$style.sendButton"
        type="submit"
        :disabled="!canSend"
        :aria-label="isLoading ? 'Sending...' : 'Send message'"
      >
        <PaperAirplaneIcon v-if="!isLoading" />
        <div v-else :class="$style.spinner" />
      </button>
    </div>

    <div v-if="error" :class="$style.error">
      <ExclamationCircleIcon />
      <span>{{ error }}</span>
      <button type="button" :class="$style.retryButton" @click="handleRetry">Retry</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { PaperAirplaneIcon, ExclamationCircleIcon } from '@heroicons/vue/24/solid'
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()
const message = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

const isLoading = computed(() => chatStore.isLoading)
const error = computed(() => chatStore.error)
const canSend = computed(() => message.value.trim() && !isLoading.value)
const placeholder = computed(() =>
  isLoading.value ? 'Waiting for response...' : 'Type your message...',
)

const handleSubmit = async () => {
  if (!canSend.value) return

  const messageText = message.value.trim()
  message.value = ''
  await nextTick()
  adjustTextareaHeight()

  await chatStore.sendMessage(messageText)
}

const handleEnterKey = (event: KeyboardEvent) => {
  if (!event.shiftKey) {
    handleSubmit()
    return
  }

  // Allow line break with Shift+Enter
  const start = (event.target as HTMLTextAreaElement).selectionStart
  const end = (event.target as HTMLTextAreaElement).selectionEnd
  message.value = message.value.substring(0, start) + '\n' + message.value.substring(end)
  nextTick(() => {
    const textarea = textareaRef.value
    if (textarea) {
      textarea.selectionStart = textarea.selectionEnd = start + 1
    }
  })
}

const handleInput = () => {
  adjustTextareaHeight()
}

const adjustTextareaHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    const scrollHeight = textareaRef.value.scrollHeight
    const maxHeight = 120 // Max ~5 lines
    textareaRef.value.style.height = Math.min(scrollHeight, maxHeight) + 'px'
  }
}

const handleRetry = () => {
  chatStore.retryLastMessage()
}

// Reset textarea height when loading state changes
watch(isLoading, () => {
  if (isLoading.value) return

  nextTick(() => {
    adjustTextareaHeight()
  })
})
</script>

<style module src="./MessageInput.module.css"></style>
