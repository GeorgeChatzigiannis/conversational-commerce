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

<style module>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.inputWrapper {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-sm);
  background-color: var(--color-background);
  border-radius: var(--radius-full);
  padding: var(--spacing-sm);
  transition: box-shadow 0.2s ease;
}

.inputWrapper:focus-within {
  box-shadow: 0 0 0 2px var(--color-primary);
}

.input {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  resize: none;
  line-height: 1.5;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  overflow-y: auto;
}

.input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input::placeholder {
  color: var(--color-text-secondary);
}

.sendButton {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.sendButton::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--color-accent-start), var(--color-accent-end));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.sendButton:not(:disabled):hover::before {
  opacity: 1;
}

.sendButton > * {
  position: relative;
  z-index: 1;
}

.sendButton:not(:disabled):hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.sendButton:not(:disabled):active {
  transform: scale(0.95);
}

.sendButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sendButton svg {
  width: 20px;
  height: 20px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top-color: var(--color-secondary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: rgba(211, 47, 47, 0.1);
  color: var(--color-error);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.error svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.retryButton {
  margin-left: auto;
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-error);
  color: var(--color-secondary);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: var(--font-weight-medium);
}

.retryButton:hover {
  opacity: 0.9;
}

/* Responsive */
@media (max-width: 768px) {
  .input {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}
</style>
