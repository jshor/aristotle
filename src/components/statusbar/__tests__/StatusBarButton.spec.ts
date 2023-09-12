import { shallowMount, VueWrapper } from '@vue/test-utils'
import { ComponentPublicInstance } from 'vue'
import StatusBarButton from '../StatusBarButton.vue'

describe('Status Bar Button', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = shallowMount(StatusBarButton)
  })

  it('should match the snapshot', async () => {
    expect(wrapper.html()).toMatchSnapshot()
  })
})
