import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Message from '../Message.vue'
import type { Message as MessageType } from '@/types/chat'

// Mock date-fns format function
vi.mock('date-fns', () => ({
  format: vi.fn(() => '12:34'),
}))

// Mock markdown processor
vi.mock('@/utils/markdownProcessor', () => ({
  preprocessMarkdownContent: vi.fn((content) => content),
}))

describe('Message.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockMessage: MessageType = {
    id: '1',
    role: 'user',
    content: 'Test message content',
    timestamp: new Date('2024-01-01T12:34:56'),
  }

  it('renders user message correctly', () => {
    const wrapper = mount(Message, {
      props: {
        message: mockMessage,
      },
    })

    expect(wrapper.text()).toContain('Test message content')
    expect(wrapper.text()).toContain('12:34')

    // Verify user message content is not processed as markdown
    const content = wrapper.find('[class*="content"]')
    expect(content.html()).not.toContain('<p>')
  })

  it('renders assistant message with different styling', () => {
    const assistantMessage: MessageType = {
      ...mockMessage,
      role: 'assistant',
      content: '**Bold text** and *italic text*',
    }

    const wrapper = mount(Message, {
      props: {
        message: assistantMessage,
      },
    })

    const container = wrapper.find('[class*="container"]')
    expect(container.classes()).toSatisfy((classes: string[]) =>
      classes.some((c) => c.includes('assistant')),
    )

    // Just verify it's rendering assistant message differently from user
    expect(wrapper.text()).toContain('Bold text')
  })

  it('shows error status when message failed', () => {
    const errorMessage: MessageType = {
      ...mockMessage,
      status: 'error',
    }

    const wrapper = mount(Message, {
      props: {
        message: errorMessage,
      },
    })

    expect(wrapper.text()).toContain('Failed to send')
  })

  it('displays user icon for user messages', () => {
    const wrapper = mount(Message, {
      props: {
        message: mockMessage,
      },
    })

    const avatar = wrapper.find('[class*="avatar"]')
    expect(avatar.exists()).toBe(true)
  })

  it('renders user message content without markdown processing', () => {
    const userMessage: MessageType = {
      id: '1',
      role: 'user',
      content: '**This should not be bold**',
      timestamp: new Date(),
    }

    const wrapper = mount(Message, {
      props: {
        message: userMessage,
      },
    })

    // Should display raw content for user messages
    expect(wrapper.text()).toContain('**This should not be bold**')
    expect(wrapper.text()).toContain('12:34') // time

    // Verify it's rendering as user message
    const container = wrapper.find('[class*="container"]')
    expect(container.classes()).toSatisfy((classes: string[]) =>
      classes.some((c) => c.includes('user')),
    )

    // Force computed property evaluation by checking text content div
    const textDiv = wrapper.find('[class*="text"]')
    expect(textDiv.element.innerHTML).toBe('**This should not be bold**')
  })
})
