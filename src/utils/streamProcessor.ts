import type {
  StreamChunk,
  ParsedChatResponse,
  ToolCall,
  FAQResult,
  Usage,
} from '@/types/chatResponse'

/**
 * Creates an initial empty chat response
 */
export function createEmptyResponse(): ParsedChatResponse {
  return {
    messageId: null,
    toolCalls: [],
    responseText: '',
    usage: null,
    finishReason: null,
    isContinued: false,
  }
}

/**
 * Processes a stream chunk and updates the response object
 * @param response - The current response object to update
 * @param chunk - The stream chunk to process
 * @returns The updated response object
 */
export function processChunk(response: ParsedChatResponse, chunk: StreamChunk): ParsedChatResponse {
  const { key, value } = chunk

  switch (key) {
    case 'f':
      // Message metadata
      const fValue = value as { messageId?: string }
      if (fValue.messageId) {
        response.messageId = fValue.messageId
      }
      break

    case '9':
      // Tool call
      const toolCallValue = value as {
        toolCallId: string
        toolName: string
        args: ToolCall['args']
      }
      response.toolCalls.push({
        id: toolCallValue.toolCallId,
        name: toolCallValue.toolName,
        args: toolCallValue.args,
      })
      break

    case 'a':
      // Tool result
      const toolResultValue = value as { toolCallId: string; result: FAQResult[] }
      const toolCall = response.toolCalls.find((tc) => tc.id === toolResultValue.toolCallId)
      if (!toolCall) break
      toolCall.result = toolResultValue.result
      break

    case '0':
      // Text content
      response.responseText += value as string
      break

    case 'e':
      // Execution info
      const eValue = value as { usage?: Usage; finishReason?: string; isContinued?: boolean }
      if (eValue.usage) {
        response.usage = eValue.usage
      }
      if (eValue.finishReason) {
        response.finishReason = eValue.finishReason
      }
      if (eValue.isContinued !== undefined) {
        response.isContinued = eValue.isContinued
      }
      break

    case 'd':
      // Additional execution info
      const dValue = value as { usage?: Usage; finishReason?: string }
      if (dValue.usage) {
        response.usage = dValue.usage
      }
      if (dValue.finishReason) {
        response.finishReason = dValue.finishReason
      }
      break
  }

  return response
}
