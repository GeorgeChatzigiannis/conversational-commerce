import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ChatContainer from '../ChatContainer.vue'
import MessageList from '../MessageList.vue'
import MessageInput from '../MessageInput.vue'
import { createTestingPinia } from '@pinia/testing'

describe('ChatContainer', () => {
  const createWrapper = () => {
    return mount(ChatContainer, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
        ],
      },
    })
  }

  it('should render the container', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('should render the header with title', () => {
    const wrapper = createWrapper()
    const header = wrapper.find('header')

    expect(header.exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('Assistant')
  })

  it('should render the subtitle', () => {
    const wrapper = createWrapper()
    const subtitle = wrapper.find('p')

    expect(subtitle.exists()).toBe(true)
    expect(subtitle.text()).toBe('How can I help you today?')
  })

  it('should render MessageList component', () => {
    const wrapper = createWrapper()

    expect(wrapper.findComponent(MessageList).exists()).toBe(true)
  })

  it('should render MessageInput component', () => {
    const wrapper = createWrapper()

    expect(wrapper.findComponent(MessageInput).exists()).toBe(true)
  })

  it('should have correct structure', () => {
    const wrapper = createWrapper()

    // Check that main container exists
    expect(wrapper.find('div').exists()).toBe(true)

    // Check header exists
    expect(wrapper.find('header').exists()).toBe(true)

    // Check message input container exists
    const containers = wrapper.findAll('div')
    expect(containers.length).toBeGreaterThan(1)
  })

  it('should apply CSS module classes', () => {
    const wrapper = createWrapper()

    // CSS modules generate unique class names, so we just check structure exists
    const header = wrapper.find('header')
    expect(header.attributes('class')).toBeTruthy()

    const title = wrapper.find('h1')
    expect(title.attributes('class')).toBeTruthy()
  })
})
