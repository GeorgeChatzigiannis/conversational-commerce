export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  error: string | null
  threadId: string
  resourceId: string
}

export interface ChatApiRequest {
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  threadId: string
  resourceId: string
}

export interface ChatApiResponse {
  role: 'assistant'
  content: string
}
