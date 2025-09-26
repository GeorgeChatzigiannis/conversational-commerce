import type { StreamChunk } from '@/types/chatResponse'

/**
 * Parses a single line from the stream response into a StreamChunk
 * @param line - The line to parse in format "key:value"
 * @returns StreamChunk with parsed key and value, or null if invalid
 */
export function parseStreamLine(line: string): StreamChunk | null {
  const colonIndex = line.indexOf(':')
  if (colonIndex === -1) return null

  const key = line.substring(0, colonIndex)
  const valueStr = line.substring(colonIndex + 1)

  try {
    const value = JSON.parse(valueStr)
    return { key, value }
  } catch {
    // If JSON parsing fails, return the raw string
    return { key, value: valueStr }
  }
}

/**
 * Processes a stream buffer and extracts complete lines
 * @param buffer - The current buffer content
 * @returns Object containing complete lines and remaining buffer
 */
export function extractLines(buffer: string): { lines: string[]; remainingBuffer: string } {
  const allLines = buffer.split('\n')
  const remainingBuffer = allLines.pop() || ''
  const lines = allLines.filter((line) => line.trim())

  return { lines, remainingBuffer }
}
