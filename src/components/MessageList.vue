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

<style module src="./MessageList.module.css"></style>
