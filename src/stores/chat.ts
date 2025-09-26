import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { Message } from '@/types/chat'
import { chatService } from '@/services/chat'

export const useChatStore = defineStore('chat', () => {
  // State
  const messages = ref<Message[]>([
    {
      id: uuidv4(),
      role: 'assistant',
      content: 'How can I help you today?',
      timestamp: new Date(),
      status: 'sent',
    },
  ])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const threadId = ref(uuidv4())
  const resourceId = ref(uuidv4())

  // Getters
  const hasMessages = computed(() => messages.value.length > 0)
  const lastMessage = computed(() => messages.value[messages.value.length - 1])

  // Actions
  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: uuidv4(),
      timestamp: new Date(),
    }
    messages.value.push(newMessage)
    return newMessage
  }

  const updateMessageStatus = (messageId: string, status: Message['status']) => {
    const foundMessage = messages.value.find((m) => m.id === messageId)
    if (!foundMessage) return
    foundMessage.status = status
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading.value) return

    // Add user message
    const userMessage = addMessage({
      role: 'user',
      content: content.trim(),
      status: 'sent',
    })

    // Reset error state
    error.value = null
    isLoading.value = true

    try {
      // Send to API
      const response = await chatService.sendMessage({
        messages: [{ role: 'user', content: userMessage.content }],
        threadId: threadId.value,
        resourceId: resourceId.value,
      })

      // Add assistant message
      addMessage({
        role: 'assistant',
        content: response.content,
        status: 'sent',
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send message. Please try again.'
      error.value = errorMessage
      updateMessageStatus(userMessage.id, 'error')
    } finally {
      isLoading.value = false
    }
  }

  const clearChat = () => {
    messages.value = [
      {
        id: uuidv4(),
        role: 'assistant',
        content: 'How can I help you today?',
        timestamp: new Date(),
        status: 'sent',
      },
    ]
    error.value = null
    threadId.value = uuidv4()
    resourceId.value = uuidv4()
  }

  const retryLastMessage = async () => {
    const lastUserMessage = [...messages.value].reverse().find((m) => m.role === 'user')
    if (!lastUserMessage) return

    // Remove any error messages after the last user message
    const lastUserMessageIndex = messages.value.indexOf(lastUserMessage)
    messages.value = messages.value.slice(0, lastUserMessageIndex + 1)

    // Resend the message
    await sendMessage(lastUserMessage.content)
  }

  return {
    // State
    messages,
    isLoading,
    error,
    threadId,
    resourceId,
    // Getters
    hasMessages,
    lastMessage,
    // Actions
    sendMessage,
    clearChat,
    retryLastMessage,
    updateMessageStatus,
  }
})
