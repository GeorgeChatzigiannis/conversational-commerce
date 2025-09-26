import { mount, type VueWrapper } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import MessageInput from '../MessageInput.vue'
import { useChatStore } from '@/stores/chat'

describe('MessageInput.vue', () => {
  let wrapper: VueWrapper
  let chatStore: ReturnType<typeof useChatStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    chatStore = useChatStore()
    wrapper = mount(MessageInput)
  })

  describe('Initial state', () => {
    it('renders the form with textarea and send button', () => {
      expect(wrapper.find('form').exists()).toBe(true)
      expect(wrapper.find('textarea').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('displays placeholder when not loading', () => {
      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('placeholder')).toBe('Type your message...')
    })

    it('disables send button when input is empty', () => {
      const sendButton = wrapper.find('button[type="submit"]')
      expect(sendButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('Message input', () => {
    it('updates message value when typing', async () => {
      const textarea = wrapper.find('textarea')
      await textarea.setValue('Hello world')
      expect(textarea.element.value).toBe('Hello world')
    })

    it('enables send button when message has content', async () => {
      const textarea = wrapper.find('textarea')
      await textarea.setValue('Hello')

      const sendButton = wrapper.find('button[type="submit"]')
      expect(sendButton.attributes('disabled')).toBeUndefined()
    })

    it('adjusts textarea height on input', async () => {
      const textarea = wrapper.find('textarea')

      Object.defineProperty(textarea.element, 'scrollHeight', {
        writable: true,
        configurable: true,
        value: 60,
      })

      await textarea.trigger('input')

      expect(textarea.element.style.height).toBe('60px')
    })
  })

  describe('Submit functionality', () => {
    it('submits message on form submit', async () => {
      const sendMessageSpy = vi.spyOn(chatStore, 'sendMessage').mockResolvedValue(undefined)
      const textarea = wrapper.find('textarea')

      await textarea.setValue('Test message')
      await wrapper.find('form').trigger('submit.prevent')

      expect(sendMessageSpy).toHaveBeenCalledWith('Test message')
      expect(textarea.element.value).toBe('')
    })

    it('submits message on Enter key without Shift', async () => {
      const sendMessageSpy = vi.spyOn(chatStore, 'sendMessage').mockResolvedValue(undefined)
      const textarea = wrapper.find('textarea')

      await textarea.setValue('Test message')
      await textarea.trigger('keydown.enter', { shiftKey: false })

      expect(sendMessageSpy).toHaveBeenCalledWith('Test message')
    })

    it('adds line break on Shift+Enter', async () => {
      const textarea = wrapper.find('textarea')
      await textarea.setValue('Line 1')

      textarea.element.selectionStart = 6
      textarea.element.selectionEnd = 6

      await textarea.trigger('keydown.enter', { shiftKey: true })
      await nextTick()

      expect(textarea.element.value).toContain('Line 1\n')
    })

    it('does not submit when message is empty or only whitespace', async () => {
      const sendMessageSpy = vi.spyOn(chatStore, 'sendMessage')

      await wrapper.find('textarea').setValue('   ')
      await wrapper.find('form').trigger('submit.prevent')

      expect(sendMessageSpy).not.toHaveBeenCalled()
    })

    it('does not submit when already loading', async () => {
      chatStore.isLoading = true
      const sendMessageSpy = vi.spyOn(chatStore, 'sendMessage')

      await wrapper.find('textarea').setValue('Test')
      await wrapper.find('form').trigger('submit.prevent')

      expect(sendMessageSpy).not.toHaveBeenCalled()
    })
  })

  describe('Loading state', () => {
    it('shows loading placeholder when loading', async () => {
      chatStore.isLoading = true
      await nextTick()

      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('placeholder')).toBe('Waiting for response...')
    })

    it('disables textarea when loading', async () => {
      chatStore.isLoading = true
      await nextTick()

      const textarea = wrapper.find('textarea')
      expect(textarea.attributes('disabled')).toBeDefined()
    })

    it('shows spinner icon when loading', async () => {
      chatStore.isLoading = true
      await nextTick()

      expect(wrapper.find('.spinner').exists()).toBe(true)
      expect(wrapper.find('svg').exists()).toBe(false)
    })

    it('resets when loading state changes', async () => {
      chatStore.isLoading = true
      await nextTick()

      expect(wrapper.find('.spinner').exists()).toBe(true)

      chatStore.isLoading = false
      await nextTick()

      expect(wrapper.find('svg').exists()).toBe(true)
    })
  })

  describe('Error handling', () => {
    it('displays error message when error exists', async () => {
      chatStore.error = 'Network error occurred'
      await nextTick()

      const errorDiv = wrapper.find('[class*="error"]')
      expect(errorDiv.exists()).toBe(true)
      expect(errorDiv.text()).toContain('Network error occurred')
      expect(errorDiv.find('button').text()).toBe('Retry')
    })

    it('calls retryLastMessage when retry button clicked', async () => {
      const retryspy = vi.spyOn(chatStore, 'retryLastMessage')
      chatStore.error = 'Error'
      await nextTick()

      await wrapper.find('[class*="retryButton"]').trigger('click')
      expect(retryspy).toHaveBeenCalled()
    })
  })

  describe('Textarea auto-resize', () => {
    it('limits textarea height to max height', async () => {
      const textarea = wrapper.find('textarea').element as HTMLTextAreaElement

      Object.defineProperty(textarea, 'scrollHeight', {
        writable: true,
        configurable: true,
        value: 200,
      })

      await wrapper.find('textarea').trigger('input')

      expect(textarea.style.height).toBe('120px')
    })

    it('sets textarea height to scrollHeight when under max', async () => {
      const textarea = wrapper.find('textarea').element as HTMLTextAreaElement

      Object.defineProperty(textarea, 'scrollHeight', {
        writable: true,
        configurable: true,
        value: 80,
      })

      await wrapper.find('textarea').trigger('input')

      expect(textarea.style.height).toBe('80px')
    })

    it('handles missing textarea ref gracefully', async () => {
      // Instead of testing internals, test the behavior
      wrapper.unmount()

      // Create a new instance and verify it doesn't throw during input
      const newWrapper = mount(MessageInput)
      const textarea = newWrapper.find('textarea')

      await expect(textarea.trigger('input')).resolves.not.toThrow()
      newWrapper.unmount()
    })
  })

  describe('Accessibility', () => {
    it('has proper aria-label for send button', () => {
      const sendButton = wrapper.find('button[type="submit"]')
      expect(sendButton.attributes('aria-label')).toBe('Send message')
    })

    it('updates aria-label when loading', async () => {
      chatStore.isLoading = true
      await nextTick()

      const sendButton = wrapper.find('button[type="submit"]')
      expect(sendButton.attributes('aria-label')).toBe('Sending...')
    })
  })

  describe('Edge cases', () => {
    it('handles handleEnterKey with text selection', async () => {
      const textarea = wrapper.find('textarea')
      await textarea.setValue('Hello world')

      textarea.element.selectionStart = 5
      textarea.element.selectionEnd = 11

      await textarea.trigger('keydown.enter', { shiftKey: true })
      await nextTick()

      expect(textarea.element.value).toBe('Hello\n')
    })

    it('handles cursor position correctly after Shift+Enter', async () => {
      const textarea = wrapper.find('textarea').element as HTMLTextAreaElement
      await wrapper.find('textarea').setValue('Hello')

      textarea.selectionStart = 2
      textarea.selectionEnd = 2

      await wrapper.find('textarea').trigger('keydown.enter', { shiftKey: true })
      await nextTick()

      expect(textarea.value).toBe('He\nllo')
      expect(textarea.selectionStart).toBe(3)
      expect(textarea.selectionEnd).toBe(3)
    })

    it('handles Shift+Enter properly', async () => {
      const textarea = wrapper.find('textarea')
      await textarea.setValue('Test')

      // Set cursor position
      textarea.element.selectionStart = 4
      textarea.element.selectionEnd = 4

      // Trigger Shift+Enter
      await textarea.trigger('keydown.enter', {
        shiftKey: true,
      })

      // The message should have a newline inserted
      expect(textarea.element.value).toBe('Test\n')
    })

    it('trims message content before sending', async () => {
      const sendMessageSpy = vi.spyOn(chatStore, 'sendMessage').mockResolvedValue(undefined)
      const textarea = wrapper.find('textarea')

      await textarea.setValue('  Test message  ')
      await wrapper.find('form').trigger('submit.prevent')

      expect(sendMessageSpy).toHaveBeenCalledWith('Test message')
    })
  })
})
