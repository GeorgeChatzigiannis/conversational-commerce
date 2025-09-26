import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import App from '../App.vue'
import ChatContainer from '../components/ChatContainer.vue'

describe('App', () => {
  const createWrapper = () => {
    return mount(App, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          ChatContainer: true,
        },
      },
    })
  }

  it('should render without errors', () => {
    const wrapper = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('should render ChatContainer component', () => {
    const wrapper = createWrapper()
    expect(wrapper.findComponent(ChatContainer).exists()).toBe(true)
  })

  it('should have no additional wrapper elements', () => {
    const wrapper = createWrapper()
    // App.vue should only contain the ChatContainer
    expect(wrapper.element.children.length).toBe(1)
    expect(wrapper.element.children[0].tagName).toBe('CHAT-CONTAINER-STUB')
  })
})
