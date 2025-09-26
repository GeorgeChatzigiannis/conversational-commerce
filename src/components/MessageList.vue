<template>
  <div ref="scrollContainer" :class="$style.container">
    <div :class="$style.messages">
      <Message v-for="message in messages" :key="message.id" :message="message" />

      <div v-if="showSuggestions" :class="$style.suggestionContainer">
        <h2 :class="$style.suggestionTitle">Try asking me about:</h2>
        <div :class="$style.suggestions">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion"
            :class="$style.suggestionButton"
            @click="handleSuggestionClick(suggestion)"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>

      <div v-if="isLoading" :class="$style.loadingContainer">
        <div :class="$style.typingIndicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import Message from './Message.vue'

const chatStore = useChatStore()
const scrollContainer = ref<HTMLElement>()

const messages = computed(() => chatStore.messages)
const isLoading = computed(() => chatStore.isLoading)

// Check if only the initial welcome message is present
const showSuggestions = computed(() => {
  return (
    messages.value.length === 1 &&
    messages.value[0].role === 'assistant' &&
    messages.value[0].content === 'How can I help you today?'
  )
})

const suggestions = [
  "What's the return policy?",
  'Recommend running shoes',
  "Where's my order?",
  "Tell me about On's technology",
]

const handleSuggestionClick = (suggestion: string) => {
  chatStore.sendMessage(suggestion)
}

// Auto-scroll to bottom when new messages arrive
watch(
  [messages, isLoading],
  async () => {
    await nextTick()
    const container = scrollContainer.value
    if (!container) return
    container.scrollTop = container.scrollHeight
  },
  { deep: true },
)
</script>

<style module>
.container {
  height: 100%;
  overflow-y: auto;
  padding: var(--spacing-lg);
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.suggestionContainer {
  text-align: center;
  max-width: 600px;
  margin: var(--spacing-lg) auto;
  padding: var(--spacing-lg);
}

.suggestionTitle {
  font-size: 1.25rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

.suggestions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-sm);
}

.suggestionButton {
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-background);
  color: var(--color-text-primary);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: var(--font-weight-medium);
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestionButton:hover {
  background-color: var(--color-primary);
  color: var(--color-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.suggestionButton:active {
  transform: translateY(0);
}

.messages {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-height: 100%;
}

.loadingContainer {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) 0;
}

.typingIndicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-background);
  border-radius: var(--radius-lg);
}

.typingIndicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-text-secondary);
  animation: typing 1.4s infinite;
}

.typingIndicator span:nth-child(1) {
  animation-delay: 0s;
}

.typingIndicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typingIndicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-10px);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: var(--spacing-md);
  }

  .suggestions {
    grid-template-columns: 1fr;
  }

  .suggestionButton {
    padding: var(--spacing-md);
  }
}
</style>
