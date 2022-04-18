
// import { Menu } from '@electron/remote'
  // const { Menu } = require('@electron/remote/main')

export default function showContextMenu ($event: Event, entries: MenuEntry[], fn?: Function) {
  if (!window.require) return

  $event.preventDefault()
  $event.stopPropagation()

  const { Menu } = window.require('@electron/remote')
  const menu = Menu.buildFromTemplate(entries)

  menu.popup()
}
