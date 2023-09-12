import { shallowMount, VueWrapper } from '@vue/test-utils'
import { ComponentPublicInstance } from 'vue'
import StatusBarViewer from '../StatusBarViewer.vue'

describe('Status Bar Viewer', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    wrapper = shallowMount(StatusBarViewer)
  })

  it('should match the snapshot', async () => {
    expect(wrapper.html()).toMatchSnapshot()
  })
})
