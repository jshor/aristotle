import { shallowMount } from '@vue/test-utils'
import OscilloscopeViewer from '../OscilloscopeViewer.vue'

describe('Oscilloscope Viewer', () => {
  it('should match the snapshot', () => {
    const wrapper = shallowMount(OscilloscopeViewer)

    expect(wrapper.html()).toMatchSnapshot()
  })
})
