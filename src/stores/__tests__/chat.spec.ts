import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from '../chat'
import { chatService } from '@/services/chat'

// Mock the chat service
vi.mock('@/services/chat', () => ({
  chatService: {
    sendMessage: vi.fn(),
  },
}))

// Mock uuid with counter for unique IDs
let uuidCounter = 0
vi.mock('uuid', () => ({
  v4: vi.fn(() => `mock-uuid-${++uuidCounter}`),
}))

describe('ChatStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()
    uuidCounter = 0 // Reset counter
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should have empty initial state', () => {
      const store = useChatStore()

      expect(store.messages).toHaveLength(1)
      expect(store.messages[0]).toMatchObject({
        role: 'assistant',
        content: 'How can I help you today?',
        status: 'sent',
      })
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.threadId).toBe('mock-uuid-2')
      expect(store.resourceId).toBe('mock-uuid-3')
    })
  })

  describe('getters', () => {
    it('hasMessages should return false when no messages', () => {
      const store = useChatStore()
      store.messages = []
      expect(store.hasMessages).toBe(false)
    })

    it('hasMessages should return true when messages exist', () => {
      const store = useChatStore()
      store.messages.push({
        id: '1',
        role: 'user',
        content: 'Test',
        timestamp: new Date(),
        status: 'sent',
      })
      expect(store.hasMessages).toBe(true)
    })

    it('lastMessage should return undefined when no messages', () => {
      const store = useChatStore()
      store.messages = []
      expect(store.lastMessage).toBeUndefined()
    })

    it('lastMessage should return the last message', () => {
      const store = useChatStore()
      const message1 = {
        id: '1',
        role: 'user' as const,
        content: 'First',
        timestamp: new Date(),
        status: 'sent' as const,
      }
      const message2 = {
        id: '2',
        role: 'assistant' as const,
        content: 'Second',
        timestamp: new Date(),
        status: 'sent' as const,
      }

      store.messages.push(message1, message2)
      expect(store.lastMessage).toStrictEqual(message2)
    })
  })

  describe('actions', () => {
    describe('sendMessage', () => {
      it('should send a message successfully', async () => {
        const store = useChatStore()
        const mockResponse = {
          role: 'assistant' as const,
          content: 'Hello! How can I help you?',
        }

        vi.mocked(chatService.sendMessage).mockResolvedValueOnce(mockResponse)

        await store.sendMessage('Hello')

        // Should have added user message
        expect(store.messages).toHaveLength(3) // initial + user + assistant
        expect(store.messages[1]).toMatchObject({
          role: 'user',
          content: 'Hello',
          status: 'sent',
        })

        // Should have added assistant response
        expect(store.messages[2]).toMatchObject({
          role: 'assistant',
          content: 'Hello! How can I help you?',
          status: 'sent',
        })

        // Should have called chat service
        expect(chatService.sendMessage).toHaveBeenCalledWith({
          messages: [{ role: 'user', content: 'Hello' }],
          threadId: 'mock-uuid-2',
          resourceId: 'mock-uuid-3',
        })

        // Loading state should be reset
        expect(store.isLoading).toBe(false)
        expect(store.error).toBeNull()
      })

      it('should not send empty messages', async () => {
        const store = useChatStore()
        const initialLength = store.messages.length

        await store.sendMessage('   ')

        expect(store.messages).toHaveLength(initialLength)
        expect(chatService.sendMessage).not.toHaveBeenCalled()
      })

      it('should not send messages while loading', async () => {
        const store = useChatStore()
        const initialLength = store.messages.length
        store.isLoading = true

        await store.sendMessage('Test')

        expect(store.messages).toHaveLength(initialLength)
        expect(chatService.sendMessage).not.toHaveBeenCalled()
      })

      it('should handle errors and update message status', async () => {
        const store = useChatStore()
        const errorMessage = 'API Error'

        vi.mocked(chatService.sendMessage).mockRejectedValueOnce(new Error(errorMessage))

        await store.sendMessage('Test message')

        // Should have user message with error status
        expect(store.messages).toHaveLength(2) // initial + user
        expect(store.messages[1].status).toBe('error')

        // Should set error message
        expect(store.error).toBe(errorMessage)
        expect(store.isLoading).toBe(false)
      })

      it('should handle errors without message property', async () => {
        const store = useChatStore()

        vi.mocked(chatService.sendMessage).mockRejectedValueOnce('String error')

        await store.sendMessage('Test')

        expect(store.error).toBe('Failed to send message. Please try again.')
      })
    })

    describe('edge cases', () => {
      it('should handle message not found during error update', async () => {
        const store = useChatStore()

        vi.mocked(chatService.sendMessage).mockRejectedValueOnce(new Error('API Error'))

        // Start sending a message
        const sendPromise = store.sendMessage('Test')

        // Wait for user message to be added
        await vi.waitFor(() => expect(store.messages).toHaveLength(2))

        // Simulate the message being removed (edge case)
        store.messages.splice(1, 1)

        // Let the promise complete
        await sendPromise

        // Should handle gracefully even though message was removed
        expect(store.error).toBe('API Error')
        expect(store.messages).toHaveLength(1) // initial message remains
      })
    })

    describe('clearChat', () => {
      it('should clear all chat state', () => {
        const store = useChatStore()

        // Add some state
        store.messages.push({
          id: '1',
          role: 'user',
          content: 'Test',
          timestamp: new Date(),
          status: 'sent',
        })
        store.error = 'Test error'

        // Clear chat
        store.clearChat()

        expect(store.messages).toHaveLength(1)
        expect(store.messages[0]).toMatchObject({
          role: 'assistant',
          content: 'How can I help you today?',
          status: 'sent',
        })
        expect(store.error).toBeNull()
        expect(store.threadId).toBeDefined()
        expect(store.resourceId).toBeDefined()
      })
    })

    describe('updateMessageStatus', () => {
      it('should handle updating status of non-existent message', () => {
        const store = useChatStore()

        // Should not throw when trying to update non-existent message
        expect(() => store.updateMessageStatus('non-existent-id', 'error')).not.toThrow()

        // Messages should remain unchanged
        expect(store.messages).toHaveLength(1) // initial message
      })

      it('should update message status when message exists', () => {
        const store = useChatStore()

        // Add a user message
        store.messages.push({
          id: 'test-id',
          role: 'user',
          content: 'Test',
          timestamp: new Date(),
          status: 'sent',
        })

        // Update status
        store.updateMessageStatus('test-id', 'error')

        // Verify status was updated
        const message = store.messages.find((m) => m.id === 'test-id')
        expect(message?.status).toBe('error')
      })
    })

    describe('retryLastMessage', () => {
      it('should retry the last user message', async () => {
        const store = useChatStore()

        // Add messages
        store.messages.push(
          {
            id: '1',
            role: 'user',
            content: 'First message',
            timestamp: new Date(),
            status: 'sent',
          },
          {
            id: '2',
            role: 'assistant',
            content: 'Response',
            timestamp: new Date(),
            status: 'sent',
          },
          {
            id: '3',
            role: 'user',
            content: 'Second message',
            timestamp: new Date(),
            status: 'error',
          },
        )

        const mockResponse = {
          role: 'assistant' as const,
          content: 'Retry successful!',
        }

        vi.mocked(chatService.sendMessage).mockResolvedValueOnce(mockResponse)

        await store.retryLastMessage()

        // Should keep messages up to last user message + new response
        expect(store.messages.length).toBeGreaterThanOrEqual(4)

        // Should have resent the last user message
        expect(chatService.sendMessage).toHaveBeenCalled()
        const lastCall = vi.mocked(chatService.sendMessage).mock.lastCall
        expect(lastCall?.[0].messages[0]).toMatchObject({
          role: 'user',
          content: 'Second message',
        })
      })

      it('should do nothing if no user messages exist', async () => {
        const store = useChatStore()
        const initialLength = store.messages.length

        await store.retryLastMessage()

        expect(chatService.sendMessage).not.toHaveBeenCalled()
        expect(store.messages).toHaveLength(initialLength)
      })

      it('should find last user message even if followed by assistant messages', async () => {
        const store = useChatStore()
        // Clear initial message for cleaner test
        store.messages = []

        store.messages.push(
          {
            id: '1',
            role: 'user',
            content: 'User message',
            timestamp: new Date(),
            status: 'sent',
          },
          {
            id: '2',
            role: 'assistant',
            content: 'Assistant response',
            timestamp: new Date(),
            status: 'sent',
          },
          {
            id: '3',
            role: 'assistant',
            content: 'Another assistant message',
            timestamp: new Date(),
            status: 'sent',
          },
        )

        const mockResponse = {
          role: 'assistant' as const,
          content: 'Retry response',
        }

        vi.mocked(chatService.sendMessage).mockResolvedValueOnce(mockResponse)

        await store.retryLastMessage()

        // Should keep the user message and any following messages plus new response
        expect(store.messages.length).toBeGreaterThanOrEqual(2)
        expect(store.messages[0].content).toBe('User message')
        expect(store.messages[store.messages.length - 1].content).toBe('Retry response')
      })
    })
  })
})
