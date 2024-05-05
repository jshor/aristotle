import { createPinia, setActivePinia } from 'pinia'
import { MenuItem } from 'electron'
import { createOscilloscopeContextMenu } from '../oscilloscope'
import { DocumentStore, createDocumentStore } from '@/store/document'
import { t } from '@/utils/i18n'
import { buildMenu } from '@/menus/__tests__/utils.helper'
import { stubAll } from '@/store/document/actions/__tests__/__helpers__'

setActivePinia(createPinia())

describe('Oscilloscope context menu', () => {
  let useDocumentStore: DocumentStore
  let menu: MenuItem[]

  beforeEach(() => {
    useDocumentStore = createDocumentStore('test-document')
    menu = buildMenu(createOscilloscopeContextMenu(useDocumentStore))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should prepend the given submenu', () => {
    const submenu = [{ label: 'Submenu' }]
    const menu = buildMenu(createOscilloscopeContextMenu(useDocumentStore, submenu))

    expect(menu).toHaveLength(5)
    expect(menu[0].label).toBe('Submenu')
  })

  it('should provide an option to clear the oscilloscope', () => {
    const store = useDocumentStore()
    const item = menu[0]

    stubAll(store.oscillator, ['clear'])
    item.click()

    expect(item.label).toBe(t('menu.oscilloscope.clearAllWaves'))
    expect(store.oscillator.clear).toHaveBeenCalledTimes(1)
  })

  it('should provide an option to remove all waves', () => {
    const store = useDocumentStore()
    const item = menu[1]

    stubAll(store, ['destroyOscilloscope'])
    item.click()

    expect(item.label).toBe(t('menu.oscilloscope.removeAllWaves'))
    expect(store.destroyOscilloscope).toHaveBeenCalledTimes(1)
  })

  it('should show a separator', () => {
    expect(menu[2].type).toBe('separator')
  })

  it('should provide an option to close the oscilloscope', () => {
    const store = useDocumentStore()
    const item = menu[3]

    stubAll(store, ['closeOscilloscope'])
    item.click()

    expect(item.label).toBe(t('menu.oscilloscope.close'))
    expect(store.closeOscilloscope).toHaveBeenCalledTimes(1)
  })
})
