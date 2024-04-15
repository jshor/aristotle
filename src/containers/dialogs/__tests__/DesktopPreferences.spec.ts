import { shallowMount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import DesktopPreferences from '../DesktopPreferences.vue'

setActivePinia(createPinia())

describe('Desktop Preferences Dialog', () => {
  it('should match the snapshot', () => {
    expect(shallowMount(DesktopPreferences).html()).toMatchSnapshot()
  })
})
