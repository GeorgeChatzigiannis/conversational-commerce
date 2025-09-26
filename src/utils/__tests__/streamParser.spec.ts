import { describe, it, expect } from 'vitest'
import { parseStreamLine, extractLines } from '../streamParser'

describe('streamParser', () => {
  describe('parseStreamLine', () => {
    it('should parse a line with JSON value', () => {
      const line = 'f:{"messageId":"msg-123"}'
      const result = parseStreamLine(line)

      expect(result).toEqual({
        key: 'f',
        value: { messageId: 'msg-123' },
      })
    })

    it('should parse a line with string value', () => {
      const line = '0:"Hello, world!"'
      const result = parseStreamLine(line)

      expect(result).toEqual({
        key: '0',
        value: 'Hello, world!',
      })
    })

    it('should parse a line with complex JSON', () => {
      const line =
        '9:{"toolCallId":"123","toolName":"ragTool","args":{"query":"test","indexName":"faqs","topK":10}}'
      const result = parseStreamLine(line)

      expect(result).toEqual({
        key: '9',
        value: {
          toolCallId: '123',
          toolName: 'ragTool',
          args: { query: 'test', indexName: 'faqs', topK: 10 },
        },
      })
    })

    it('should return null for lines without colon', () => {
      const line = 'invalid line'
      const result = parseStreamLine(line)

      expect(result).toBeNull()
    })

    it('should handle lines with multiple colons', () => {
      const line = 'a:{"url":"https://example.com:8080/path"}'
      const result = parseStreamLine(line)

      expect(result).toEqual({
        key: 'a',
        value: { url: 'https://example.com:8080/path' },
      })
    })

    it('should handle invalid JSON as raw string', () => {
      const line = '0:This is not JSON'
      const result = parseStreamLine(line)

      expect(result).toEqual({
        key: '0',
        value: 'This is not JSON',
      })
    })
  })

  describe('extractLines', () => {
    it('should extract complete lines and return remaining buffer', () => {
      const buffer = 'line1\nline2\nincomplete'
      const result = extractLines(buffer)

      expect(result.lines).toEqual(['line1', 'line2'])
      expect(result.remainingBuffer).toBe('incomplete')
    })

    it('should filter out empty lines', () => {
      const buffer = 'line1\n\nline2\n\n'
      const result = extractLines(buffer)

      expect(result.lines).toEqual(['line1', 'line2'])
      expect(result.remainingBuffer).toBe('')
    })

    it('should handle buffer with only newlines', () => {
      const buffer = '\n\n\n'
      const result = extractLines(buffer)

      expect(result.lines).toEqual([])
      expect(result.remainingBuffer).toBe('')
    })

    it('should handle buffer without newlines', () => {
      const buffer = 'single line without newline'
      const result = extractLines(buffer)

      expect(result.lines).toEqual([])
      expect(result.remainingBuffer).toBe('single line without newline')
    })

    it('should handle empty buffer', () => {
      const buffer = ''
      const result = extractLines(buffer)

      expect(result.lines).toEqual([])
      expect(result.remainingBuffer).toBe('')
    })
  })
})
