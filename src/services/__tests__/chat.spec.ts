import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  type MockInstance,
} from 'vitest'
import { ref, type Ref } from 'vue'
import { useChatResponse } from '@/composables/useChatResponse'
import type { ParsedChatResponse } from '@/types/chatResponse'
import { createEmptyResponse } from '@/utils/streamProcessor'
import type { ChatApiRequest, ChatApiResponse } from '@/types/chat'

// Mock the composable
vi.mock('@/composables/useChatResponse', () => ({
  useChatResponse: vi.fn(),
}))

// Helper to create Response mocks for error cases
function createErrorResponse(status: number, statusText: string, body = ''): Response {
  const response = new Response(body, { status, statusText })
  // Override the ok property for error responses
  Object.defineProperty(response, 'ok', {
    get() {
      return false
    },
  })
  // Mock the text method
  response.text = vi.fn().mockResolvedValue(body)
  return response
}

describe('ChatService', () => {
  let mockStreamResponse: ReturnType<typeof vi.fn>
  let fetchSpy: MockInstance<typeof global.fetch>
  let chatService: {
    sendMessage: (
      request: ChatApiRequest,
      onStreamChunk?: (text: string) => void,
    ) => Promise<ChatApiResponse>
  }

  beforeAll(() => {
    // Set up environment before importing the service
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_CONVAI_API_KEY: 'test-api-key',
        },
      },
    })
  })

  beforeEach(async () => {
    // Clear module cache and re-import
    vi.resetModules()
    const module = await import('../chat')
    chatService = module.chatService

    mockStreamResponse = vi.fn()
    const mockCurrentResponse = ref<ParsedChatResponse>(createEmptyResponse())
    const mockIsStreaming = ref(false)
    const mockError = ref<string | null>(null)

    vi.mocked(useChatResponse).mockReturnValue({
      streamResponse: mockStreamResponse,
      currentResponse: mockCurrentResponse as Readonly<Ref<ParsedChatResponse>>,
      isStreaming: mockIsStreaming as Readonly<Ref<boolean>>,
      error: mockError as Readonly<Ref<string | null>>,
      resetResponse: vi.fn(),
    })

    fetchSpy = vi.spyOn(global, 'fetch')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('sendMessage', () => {
    it('should send a message to the API and return response', async () => {
      const mockResponse = new Response('mock-body', {
        status: 200,
        statusText: 'OK',
      })

      fetchSpy.mockResolvedValueOnce(mockResponse)

      const parsedResponse = {
        messageId: 'msg-123',
        responseText: 'Hello, how can I help?',
        toolCalls: [],
        usage: null,
        finishReason: 'stop',
        isContinued: false,
      }

      mockStreamResponse.mockResolvedValueOnce(parsedResponse)

      const request = {
        messages: [{ role: 'user' as const, content: 'Hello' }],
        threadId: 'thread-123',
        resourceId: 'resource-456',
      }

      const result = await chatService.sendMessage(request)

      expect(fetchSpy).toHaveBeenCalled()
      const [url, options] = fetchSpy.mock.calls[0]
      expect(url).toBe('/api/agents/copilotAgent/stream')
      expect(options?.method).toBe('POST')
      const headers = options?.headers as Record<string, string>
      expect(headers?.['Content-Type']).toBe('application/json')
      expect(headers?.['Convai-Api-Key']).toBeTruthy() // Just check it exists
      expect(options?.body).toBe(JSON.stringify(request))

      expect(mockStreamResponse).toHaveBeenCalledWith(mockResponse, undefined)

      expect(result).toEqual({
        role: 'assistant',
        content: 'Hello, how can I help?',
      })
    })

    it('should pass onStreamChunk callback to streamResponse', async () => {
      const mockResponse = new Response('mock-body', {
        status: 200,
        statusText: 'OK',
      })

      fetchSpy.mockResolvedValueOnce(mockResponse)

      const parsedResponse = {
        messageId: 'msg-123',
        responseText: 'Test response',
        toolCalls: [],
        usage: null,
        finishReason: 'stop',
        isContinued: false,
      }

      mockStreamResponse.mockResolvedValueOnce(parsedResponse)

      const onChunk = vi.fn()
      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        threadId: 'thread-123',
        resourceId: 'resource-456',
      }

      await chatService.sendMessage(request, onChunk)

      expect(mockStreamResponse).toHaveBeenCalledWith(mockResponse, onChunk)
    })

    it('should handle 401 authentication error', async () => {
      const mockResponse = createErrorResponse(401, 'Unauthorized', 'Unauthorized')

      fetchSpy.mockResolvedValueOnce(mockResponse)

      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        threadId: 'thread-123',
        resourceId: 'resource-456',
      }

      await expect(chatService.sendMessage(request)).rejects.toThrow(
        'Authentication failed. Please check your API key.',
      )
    })

    it('should handle 429 rate limit error', async () => {
      const mockResponse = createErrorResponse(429, 'Too Many Requests', 'Too many requests')

      fetchSpy.mockResolvedValueOnce(mockResponse)

      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        threadId: 'thread-123',
        resourceId: 'resource-456',
      }

      await expect(chatService.sendMessage(request)).rejects.toThrow(
        'Too many requests. Please try again later.',
      )
    })

    it('should handle 500 server error', async () => {
      const mockResponse = createErrorResponse(
        500,
        'Internal Server Error',
        'Internal server error',
      )

      fetchSpy.mockResolvedValueOnce(mockResponse)

      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        threadId: 'thread-123',
        resourceId: 'resource-456',
      }

      await expect(chatService.sendMessage(request)).rejects.toThrow(
        'Server error. Please try again later.',
      )
    })

    it('should handle generic HTTP errors', async () => {
      const mockResponse = createErrorResponse(400, 'Bad Request', 'Bad request')

      fetchSpy.mockResolvedValueOnce(mockResponse)

      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        threadId: 'thread-123',
        resourceId: 'resource-456',
      }

      await expect(chatService.sendMessage(request)).rejects.toThrow('Bad request')
    })

    it('should handle HTTP errors without error text', async () => {
      const mockResponse = createErrorResponse(403, 'Forbidden', '')

      fetchSpy.mockResolvedValueOnce(mockResponse)

      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        threadId: 'thread-123',
        resourceId: 'resource-456',
      }

      await expect(chatService.sendMessage(request)).rejects.toThrow('HTTP error! status: 403')
    })

    it('should handle network errors', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('Network error'))

      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        threadId: 'thread-123',
        resourceId: 'resource-456',
      }

      await expect(chatService.sendMessage(request)).rejects.toThrow('Network error')
    })

    it('should log errors to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      fetchSpy.mockRejectedValueOnce(new Error('Test error'))

      const request = {
        messages: [{ role: 'user' as const, content: 'Test' }],
        threadId: 'thread-123',
        resourceId: 'resource-456',
      }

      try {
        await chatService.sendMessage(request)
      } catch {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith('Chat API error:', expect.any(Error))

      consoleErrorSpy.mockRestore()
    })
  })
})
