import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { createDocumentMenu } from '../document'
import { createDocumentStore } from '@/store/document'
import { t } from '@/utils/i18n'
import { buildMenu } from '@/menus/__tests__/utils.helper'
import { createHelpSubmenu } from '@/menus/submenus/help'
import { createFileSubmenu } from '@/menus/submenus/file'
import { createEditSubmenu } from '@/menus/submenus/edit'
import { createViewSubmenu } from '@/menus/submenus/view'

vi.mock('@/menus/submenus/file', () => ({
  createFileSubmenu: () => [{ label: 'File submenu stub' }]
}))
vi.mock('@/menus/submenus/edit', () => ({
  createEditSubmenu: () => [{ label: 'Edit submenu stub' }]
}))
vi.mock('@/menus/submenus/view', () => ({
  createViewSubmenu: () => [{ label: 'View submenu stub' }]
}))
vi.mock('@/menus/submenus/help', () => ({
  createHelpSubmenu: () => [{ label: 'Help submenu stub' }]
}))

describe('File submenu', () => {
  const useDocumentStore = createDocumentStore('test-document')

  beforeEach(() => {
    setActivePinia(createTestingPinia())

  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should provide the file submenu', () => {
    const item = buildMenu(createDocumentMenu(useDocumentStore))[0]

    expect(item.label).toBe(t('menu.file.parent'))
    expect(item.submenu).toEqual(createFileSubmenu(useDocumentStore))
  })

  it('should provide the edit submenu', () => {
    const item = buildMenu(createDocumentMenu(useDocumentStore))[1]

    expect(item.label).toBe(t('menu.edit.parent'))
    expect(item.submenu).toEqual(createEditSubmenu(useDocumentStore))
  })

  it('should provide the view submenu', () => {
    const item = buildMenu(createDocumentMenu(useDocumentStore))[2]

    expect(item.label).toBe(t('menu.view.parent'))
    expect(item.submenu).toEqual(createViewSubmenu(useDocumentStore))
  })

  it('should provide the help submenu', () => {
    const item = buildMenu(createDocumentMenu(useDocumentStore))[3]

    expect(item.label).toBe(t('menu.help.parent'))
    expect(item.role).toBe('help')
    expect(item.submenu).toEqual(createHelpSubmenu())
  })
})
