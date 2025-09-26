import { ref, type Ref } from 'vue'
import type { ParsedChatResponse } from '@/types/chatResponse'
import { parseStreamLine, extractLines } from '@/utils/streamParser'
import { createEmptyResponse, processChunk } from '@/utils/streamProcessor'

export function useChatResponse() {
  const currentResponse = ref<ParsedChatResponse>(createEmptyResponse())
  const isStreaming = ref(false)
  const error = ref<string | null>(null)

  function resetResponse() {
    currentResponse.value = createEmptyResponse()
    error.value = null
  }

  async function streamResponse(
    response: Response,
    onChunk?: (text: string) => void,
  ): Promise<ParsedChatResponse> {
    resetResponse()
    isStreaming.value = true

    try {
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const { lines, remainingBuffer } = extractLines(buffer)
        buffer = remainingBuffer

        for (const line of lines) {
          const chunk = parseStreamLine(line)
          if (!chunk) continue

          currentResponse.value = processChunk(currentResponse.value, chunk)

          if (chunk.key === '0' && onChunk && typeof chunk.value === 'string') {
            onChunk(chunk?.value)
          }
        }
      }

      // Process any remaining buffer
      if (!buffer.trim()) {
        isStreaming.value = false
        return { ...currentResponse.value }
      }

      const chunk = parseStreamLine(buffer)
      if (!chunk) {
        isStreaming.value = false
        return { ...currentResponse.value }
      }

      currentResponse.value = processChunk(currentResponse.value, chunk)
      if (chunk.key === '0' && onChunk && typeof chunk.value === 'string') {
        onChunk(chunk.value)
      }

      isStreaming.value = false
      return { ...currentResponse.value }
    } catch (err) {
      isStreaming.value = false
      error.value = err instanceof Error ? err.message : 'Stream processing failed'
      throw err
    }
  }

  return {
    currentResponse: currentResponse as Readonly<Ref<ParsedChatResponse>>,
    isStreaming: isStreaming as Readonly<Ref<boolean>>,
    error: error as Readonly<Ref<string | null>>,
    streamResponse,
    resetResponse,
  }
}
