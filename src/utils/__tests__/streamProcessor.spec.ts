import { describe, it, expect, beforeEach } from 'vitest'
import { createEmptyResponse, processChunk } from '../streamProcessor'
import type { ParsedChatResponse, StreamChunk } from '@/types/chatResponse'

describe('streamProcessor', () => {
  describe('createEmptyResponse', () => {
    it('should create an empty response object', () => {
      const response = createEmptyResponse()

      expect(response).toEqual({
        messageId: null,
        toolCalls: [],
        responseText: '',
        usage: null,
        finishReason: null,
        isContinued: false,
      })
    })
  })

  describe('processChunk', () => {
    let response: ParsedChatResponse

    beforeEach(() => {
      response = createEmptyResponse()
    })

    it('should process message metadata (f)', () => {
      const chunk: StreamChunk = {
        key: 'f',
        value: { messageId: 'msg-123' },
      }

      const result = processChunk(response, chunk)

      expect(result.messageId).toBe('msg-123')
    })

    it('should process tool call (9)', () => {
      const chunk: StreamChunk = {
        key: '9',
        value: {
          toolCallId: 'call-123',
          toolName: 'ragTool',
          args: { query: 'test', indexName: 'faqs', topK: 10 },
        },
      }

      const result = processChunk(response, chunk)

      expect(result.toolCalls).toHaveLength(1)
      expect(result.toolCalls[0]).toEqual({
        id: 'call-123',
        name: 'ragTool',
        args: { query: 'test', indexName: 'faqs', topK: 10 },
      })
    })

    it('should process tool result (a)', () => {
      // First add a tool call
      response = processChunk(response, {
        key: '9',
        value: {
          toolCallId: 'call-123',
          toolName: 'ragTool',
          args: { query: 'test', indexName: 'faqs', topK: 10 },
        },
      })

      // Then add the result
      const chunk: StreamChunk = {
        key: 'a',
        value: {
          toolCallId: 'call-123',
          result: [
            {
              id: 'doc-1',
              score: 0.95,
              metadata: { title: 'Test', content: 'Test content' },
            },
          ],
        },
      }

      const result = processChunk(response, chunk)

      expect(result.toolCalls[0].result).toBeDefined()
      expect(result.toolCalls[0].result).toHaveLength(1)
      expect(result.toolCalls[0].result![0].id).toBe('doc-1')
    })

    it('should append text content (0)', () => {
      const chunk1: StreamChunk = { key: '0', value: 'Hello' }
      const chunk2: StreamChunk = { key: '0', value: ' world!' }

      response = processChunk(response, chunk1)
      response = processChunk(response, chunk2)

      expect(response.responseText).toBe('Hello world!')
    })

    it('should process execution info (e)', () => {
      const chunk: StreamChunk = {
        key: 'e',
        value: {
          finishReason: 'stop',
          usage: { promptTokens: 100, completionTokens: 50 },
          isContinued: false,
        },
      }

      const result = processChunk(response, chunk)

      expect(result.finishReason).toBe('stop')
      expect(result.usage).toEqual({ promptTokens: 100, completionTokens: 50 })
      expect(result.isContinued).toBe(false)
    })

    it('should process additional execution info (d)', () => {
      const chunk: StreamChunk = {
        key: 'd',
        value: {
          finishReason: 'tool-calls',
          usage: { promptTokens: 200, completionTokens: 100 },
        },
      }

      const result = processChunk(response, chunk)

      expect(result.finishReason).toBe('tool-calls')
      expect(result.usage).toEqual({ promptTokens: 200, completionTokens: 100 })
    })

    it('should handle unknown chunk types', () => {
      const chunk: StreamChunk = {
        key: 'unknown',
        value: { some: 'data' },
      }

      const result = processChunk(response, chunk)

      // Should not modify the response for unknown keys
      expect(result).toEqual(response)
    })

    it('should not crash on missing tool call when processing result', () => {
      const chunk: StreamChunk = {
        key: 'a',
        value: {
          toolCallId: 'non-existent',
          result: [],
        },
      }

      const result = processChunk(response, chunk)

      // Should handle gracefully without errors
      expect(result.toolCalls).toHaveLength(0)
    })
  })
})
