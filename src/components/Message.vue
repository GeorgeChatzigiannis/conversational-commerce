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

<style module src="./Message.module.css"></style>
