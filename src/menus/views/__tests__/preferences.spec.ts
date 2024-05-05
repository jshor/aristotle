import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createPreferencesMenu } from '../preferences'
import { t } from '@/utils/i18n'
import { buildMenu } from '@/menus/__tests__/utils.helper'
import { useRootStore } from '@/store/root'
import { stubAll } from '@/store/document/actions/__tests__/__helpers__'
import { ViewType } from '@/types/enums/ViewType'
import { createHelpSubmenu } from '@/menus/submenus/help'

describe('Preferences dialog menu', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('the file menu', () => {
    it('should provide an option to close the preferences dialog', () => {
      const store = useRootStore()
      store.dialogType = ViewType.Preferences
      const item = buildMenu(createPreferencesMenu())[0].submenu[0]

      stubAll(window, ['close'])
      item.click()

      expect(item.label).toBe(t('menu.file.closePreferences'))
      expect(item.accelerator).toBe('Escape')
      expect(store.dialogType).toEqual(ViewType.None)
    })

    it('should provide an option to close the application', () => {
      const item = buildMenu(createPreferencesMenu())[0].submenu[2]

      stubAll(window, ['close'])
      item.click()

      expect(item.label).toBe(t('menu.file.exit'))
      expect(item.accelerator).toBe('CmdOrCtrl+Q')
      expect(window.close).toHaveBeenCalledTimes(1)
    })
  })

  it('should provide the help submenu', () => {
    const item = buildMenu(createPreferencesMenu())[1]

    expect(item.label).toBe(t('menu.help.parent'))
    expect(item.role).toBe('help')
    expect(item.submenu).toEqual(createHelpSubmenu())
  })
})
