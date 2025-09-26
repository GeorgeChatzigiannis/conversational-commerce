export type StreamChunk =
  | { key: 'f'; value: { messageId?: string } }
  | { key: '9'; value: { toolCallId: string; toolName: string; args: ToolCall['args'] } }
  | { key: 'a'; value: { toolCallId: string; result: FAQResult[] } }
  | { key: '0'; value: string }
  | { key: 'e'; value: { usage?: Usage; finishReason?: string; isContinued?: boolean } }
  | { key: 'd'; value: { usage?: Usage; finishReason?: string } }
  | { key: string; value: unknown } // fallback for other keys

export interface ToolCall {
  toolCallId: string
  toolName: string
  args: {
    query: string
    indexName: string
    topK: number
  }
}

export interface FAQResult {
  id: string
  score: number
  metadata: {
    title: string
    content: string
  }
}

export interface Usage {
  promptTokens: number
  completionTokens: number
}

export interface ParsedChatResponse {
  messageId: string | null
  toolCalls: Array<{
    id: string
    name: string
    args: ToolCall['args']
    result?: FAQResult[]
  }>
  responseText: string
  usage: Usage | null
  finishReason: string | null
  isContinued: boolean
}

export interface ChatResponseState {
  currentResponse: ParsedChatResponse
  isStreaming: boolean
  error: string | null
}
