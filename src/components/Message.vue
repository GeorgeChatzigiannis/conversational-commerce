<template>
  <div :class="[$style.container, $style[message.role]]">
    <div :class="$style.avatar">
      <UserIcon v-if="message.role === 'user'" />
      <OnLogoIcon v-else :size="24" />
    </div>

    <div :class="$style.content">
      <div v-if="message.role === 'assistant'" :class="$style.text" v-html="parsedContent" />
      <div v-else :class="$style.text">{{ message.content }}</div>
      <div :class="$style.metadata">
        <span :class="$style.time">{{ formattedTime }}</span>
        <span v-if="message.status === 'error'" :class="$style.error"> Failed to send </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import { UserIcon } from '@heroicons/vue/24/solid'
import MarkdownIt from 'markdown-it'
import OnLogoIcon from './OnLogoIcon.vue'
import type { Message } from '@/types/chat'
import { preprocessMarkdownContent } from '@/utils/markdownProcessor'

const props = defineProps<{
  message: Message
}>()

const md = new MarkdownIt({
  linkify: true,
  breaks: true,
  typographer: true,
})

const formattedTime = computed(() => {
  return format(new Date(props.message.timestamp), 'HH:mm')
})

const parsedContent = computed(() => {
  // if (props.message.role === 'user') {
  //   return props.message.content
  // }

  // Pre-process content to handle custom SKU notation
  const processedContent = preprocessMarkdownContent(props.message.content)

  return md.render(processedContent)
})
</script>

<style module>
.container {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  animation: messageSlide 0.3s ease-out;
}

@keyframes messageSlide {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user {
  flex-direction: row-reverse;
}

.assistant {
  background-color: var(--color-background);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-secondary);
}

.user .avatar {
  background-color: var(--color-primary);
}

.assistant .avatar {
  background: var(--color-secondary);
  border: 1px solid var(--color-background);
  color: var(--color-primary);
}

.content {
  flex: 1;
  max-width: 70%;
}

.text {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-text-primary);
  word-wrap: break-word;
  white-space: pre-wrap;
}

.text :global(a) {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  position: relative;
}

.text :global(a)::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: currentColor;
  transform: scaleX(0);
  transition: transform 0.2s ease;
}

.text :global(a:hover)::after {
  transform: scaleX(1);
}

.text :global(strong) {
  font-weight: var(--font-weight-bold);
}

.text :global(em) {
  font-style: italic;
  color: var(--color-text-secondary);
  font-size: 0.875em;
}

.text :global(ul),
.text :global(ol) {
  margin: var(--spacing-sm) 0;
  padding-left: var(--spacing-lg);
}

.text :global(li) {
  margin: var(--spacing-xs) 0;
}

.text :global(p) {
  margin: var(--spacing-sm) 0;
}

.text :global(p:first-child) {
  margin-top: 0;
}

.text :global(p:last-child) {
  margin-bottom: 0;
}

.user .text {
  text-align: right;
}

.metadata {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.user .metadata {
  justify-content: flex-end;
}

.time {
  opacity: 0.7;
}

.error {
  color: var(--color-error);
  font-weight: var(--font-weight-medium);
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: var(--spacing-sm);
  }

  .avatar {
    width: 30px;
    height: 30px;
  }

  .content {
    max-width: 80%;
  }

  .text {
    font-size: 0.875rem;
  }
}
</style>
