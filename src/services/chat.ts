import type { ChatApiRequest, ChatApiResponse } from '@/types/chat'
import { useChatResponse } from '@/composables/useChatResponse'

class ChatService {
  private apiKey: string

  constructor() {
    this.apiKey = import.meta.env.VITE_CONVAI_API_KEY
  }

  async sendMessage(
    request: ChatApiRequest,
    onStreamChunk?: (text: string) => void,
  ): Promise<ChatApiResponse> {
    try {
      const response = await fetch('/api/agents/copilotAgent/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Convai-Api-Key': this.apiKey,
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(this.getHttpErrorMessage(response.status, errorText))
      }

      const { streamResponse } = useChatResponse()
      const parsedResponse = await streamResponse(response, onStreamChunk)

      return {
        role: 'assistant',
        content: parsedResponse.responseText,
      }
    } catch (error) {
      console.error('Chat API error:', error)
      throw error
    }
  }

  private getHttpErrorMessage(status: number, errorText?: string): string {
    switch (status) {
      case 401:
        return 'Authentication failed. Please check your API key.'
      case 429:
        return 'Too many requests. Please try again later.'
      case 500:
        return 'Server error. Please try again later.'
      default:
        return errorText || `HTTP error! status: ${status}`
    }
  }
}

export const chatService = new ChatService()
