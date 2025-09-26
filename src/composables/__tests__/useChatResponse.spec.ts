import { describe, it, expect, vi } from 'vitest'
import { useChatResponse } from '../useChatResponse'

// Mock the ReadableStream API
function createMockReadableStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const encodedChunks = chunks.map((chunk) => encoder.encode(chunk))
  let index = 0

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index >= encodedChunks.length) {
        controller.close()
        return
      }
      controller.enqueue(encodedChunks[index])
      index++
    },
  })
}

function createMockResponse(body: ReadableStream<Uint8Array> | null = null): Response {
  return {
    body,
    ok: true,
    status: 200,
  } as Response
}

describe('useChatResponse', () => {
  it('should initialize with empty state', () => {
    const { currentResponse, isStreaming, error } = useChatResponse()

    expect(currentResponse.value).toEqual({
      messageId: null,
      toolCalls: [],
      responseText: '',
      usage: null,
      finishReason: null,
      isContinued: false,
    })
    expect(isStreaming.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('should reset response state', () => {
    const { currentResponse, error, resetResponse, streamResponse } = useChatResponse()

    // Process a stream to modify state
    const mockResponse = createMockResponse(
      createMockReadableStream(['f:{"messageId":"test-123"}\n', '0:"Hello"\n']),
    )

    // Process stream and then reset
    streamResponse(mockResponse).then(() => {
      resetResponse()

      expect(currentResponse.value).toEqual({
        messageId: null,
        toolCalls: [],
        responseText: '',
        usage: null,
        finishReason: null,
        isContinued: false,
      })
      expect(error.value).toBeNull()
    })
  })

  it('should process a simple text stream', async () => {
    const chunks = [
      'f:{"messageId":"msg-123"}\n',
      '0:"Hello"\n',
      '0:" world!"\n',
      'e:{"finishReason":"stop","usage":{"promptTokens":10,"completionTokens":5},"isContinued":false}\n',
    ]

    const mockResponse = createMockResponse(createMockReadableStream(chunks))

    const { streamResponse } = useChatResponse()
    const result = await streamResponse(mockResponse)

    expect(result.messageId).toBe('msg-123')
    expect(result.responseText).toBe('Hello world!')
    expect(result.finishReason).toBe('stop')
    expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 5 })
  })

  it('should handle tool calls and results', async () => {
    const chunks = [
      'f:{"messageId":"msg-456"}\n',
      '9:{"toolCallId":"call-789","toolName":"ragTool","args":{"query":"test","indexName":"faqs","topK":5}}\n',
      'a:{"toolCallId":"call-789","result":[{"id":"doc-1","score":0.9,"metadata":{"title":"FAQ 1","content":"Answer 1"}}]}\n',
      '0:"Based on the FAQ results..."\n',
      'd:{"finishReason":"stop","usage":{"promptTokens":20,"completionTokens":10}}\n',
    ]

    const mockResponse = createMockResponse(createMockReadableStream(chunks))

    const { streamResponse } = useChatResponse()
    const result = await streamResponse(mockResponse)

    expect(result.toolCalls).toHaveLength(1)
    expect(result.toolCalls[0]).toMatchObject({
      id: 'call-789',
      name: 'ragTool',
      args: { query: 'test', indexName: 'faqs', topK: 5 },
      result: [
        {
          id: 'doc-1',
          score: 0.9,
          metadata: { title: 'FAQ 1', content: 'Answer 1' },
        },
      ],
    })
    expect(result.responseText).toBe('Based on the FAQ results...')
  })

  it('should call onChunk callback for text chunks', async () => {
    const chunks = ['0:"First"\n', '0:" chunk"\n', '0:" of text"\n']

    const mockResponse = createMockResponse(createMockReadableStream(chunks))

    const onChunk = vi.fn()
    const { streamResponse } = useChatResponse()
    await streamResponse(mockResponse, onChunk)

    expect(onChunk).toHaveBeenCalledTimes(3)
    expect(onChunk).toHaveBeenNthCalledWith(1, 'First')
    expect(onChunk).toHaveBeenNthCalledWith(2, ' chunk')
    expect(onChunk).toHaveBeenNthCalledWith(3, ' of text')
  })

  it('should handle streaming state', async () => {
    const chunks = ['0:"Test"\n']
    const mockResponse = createMockResponse(createMockReadableStream(chunks))

    const { streamResponse, isStreaming } = useChatResponse()

    expect(isStreaming.value).toBe(false)

    const promise = streamResponse(mockResponse)
    expect(isStreaming.value).toBe(true)

    await promise
    expect(isStreaming.value).toBe(false)
  })

  it('should reset streaming state even when error is thrown', async () => {
    const mockResponse = createMockResponse({
      getReader: () => {
        throw new Error('Stream error')
      },
    } as unknown as ReadableStream<Uint8Array>)

    const { streamResponse, isStreaming } = useChatResponse()

    expect(isStreaming.value).toBe(false)

    try {
      await streamResponse(mockResponse)
    } catch {
      // Expected to throw
    }

    // isStreaming should be false after error
    expect(isStreaming.value).toBe(false)
  })

  it('should reset streaming state when error occurs during stream processing', async () => {
    // Create a stream that throws an error after successfully starting
    class ErrorReadableStream {
      private shouldThrow = false

      getReader() {
        return {
          read: async () => {
            if (!this.shouldThrow) {
              this.shouldThrow = true
              const encoder = new TextEncoder()
              return { done: false, value: encoder.encode('0:"Start"\\n') }
            }
            throw new Error('Stream processing error')
          },
        }
      }
    }

    const mockResponse = createMockResponse(
      new ErrorReadableStream() as unknown as ReadableStream<Uint8Array>,
    )
    const { streamResponse, isStreaming } = useChatResponse()

    expect(isStreaming.value).toBe(false)

    try {
      await streamResponse(mockResponse)
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect((err as Error).message).toBe('Stream processing error')
    }

    // isStreaming should be false after error during processing
    expect(isStreaming.value).toBe(false)
  })

  it('should handle errors', async () => {
    const mockResponse = createMockResponse(null)

    const { streamResponse, error } = useChatResponse()

    await expect(streamResponse(mockResponse)).rejects.toThrow('No response body')
    expect(error.value).toBe('No response body')
  })

  it('should handle non-Error exceptions', async () => {
    const mockResponse = createMockResponse({
      getReader: () => {
        throw 'String error' // Throwing a non-Error value
      },
    } as unknown as ReadableStream<Uint8Array>)

    const { streamResponse, error } = useChatResponse()

    await expect(streamResponse(mockResponse)).rejects.toThrow('String error')
    expect(error.value).toBe('Stream processing failed')
  })

  it('should handle partial chunks across reads', async () => {
    const chunks = ['f:{"messag', 'eId":"msg-123"}\n0:"Hello', ' world!"\n']

    const mockResponse = createMockResponse(createMockReadableStream(chunks))

    const { streamResponse } = useChatResponse()
    const result = await streamResponse(mockResponse)

    expect(result.messageId).toBe('msg-123')
    expect(result.responseText).toBe('Hello world!')
  })

  it('should handle remaining buffer at end of stream', async () => {
    const chunks = [
      '0:"Hello"\n',
      '0:" world!"', // No trailing newline
    ]

    const mockResponse = createMockResponse(createMockReadableStream(chunks))

    const { streamResponse } = useChatResponse()
    const result = await streamResponse(mockResponse)

    expect(result.responseText).toBe('Hello world!')
  })

  it('should call onChunk for remaining buffer text chunks', async () => {
    const chunks = [
      '0:"First chunk"\n',
      '0:"Last chunk without newline"', // No trailing newline
    ]

    const mockResponse = createMockResponse(createMockReadableStream(chunks))
    const onChunk = vi.fn()

    const { streamResponse } = useChatResponse()
    await streamResponse(mockResponse, onChunk)

    expect(onChunk).toHaveBeenCalledTimes(2)
    expect(onChunk).toHaveBeenNthCalledWith(1, 'First chunk')
    expect(onChunk).toHaveBeenNthCalledWith(2, 'Last chunk without newline')
  })

  it('should skip invalid lines that cannot be parsed', async () => {
    const chunks = [
      'f:{"messageId":"msg-123"}\n',
      'invalid line\n', // This will return null from parseStreamLine
      '0:"Valid text"\n',
    ]

    const mockResponse = createMockResponse(createMockReadableStream(chunks))

    const { streamResponse } = useChatResponse()
    const result = await streamResponse(mockResponse)

    expect(result.messageId).toBe('msg-123')
    expect(result.responseText).toBe('Valid text')
  })

  it('should handle invalid remaining buffer', async () => {
    const chunks = [
      '0:"Valid chunk"\n',
      'invalid buffer', // No newline, invalid format
    ]

    const mockResponse = createMockResponse(createMockReadableStream(chunks))

    const { streamResponse } = useChatResponse()
    const result = await streamResponse(mockResponse)

    expect(result.responseText).toBe('Valid chunk')
  })

  it('should handle empty remaining buffer after trim', async () => {
    const chunks = [
      '0:"Valid chunk"\n',
      '   ', // Only whitespace
    ]

    const mockResponse = createMockResponse(createMockReadableStream(chunks))

    const { streamResponse } = useChatResponse()
    const result = await streamResponse(mockResponse)

    expect(result.responseText).toBe('Valid chunk')
  })
})
