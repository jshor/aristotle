import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from '@/App.vue'
import { i18n } from '@/utils/i18n'
import '@/styles/main.scss'

let clipboardContents = ''

if (!window.api) {
  // stub the ipc api for non-electron environments
  // TODO: once the app is fully electron, move this to vi setup file
  window.api = {
    showContextMenu () {},
    setApplicationMenu () {},
    showOpenFileDialog () { return [] },
    showSaveFileDialog () { return '' },
    showMessageBox () { return 0 },
    beep () {},
    quit () {},
    onBeforeClose () {},
    onOpenFile () {},
    openFile () { return '' },
    saveFile () {},
    setFullscreen (isFullscreen = false) {
      try {
        if (isFullscreen) {
          document.exitFullscreen()
        } else {
          document.documentElement.requestFullscreen()
        }
      } catch (e) {
        console.error('Failed to toggle fullscreen', e)
      }
    },
    getFilePaths () { return [] },
    getDefaultSavePath () { return ''},
    setClipboardContents (_clipboardContents: string) {
      clipboardContents = _clipboardContents
    },
    getClipboardContents () {
      return clipboardContents
    },
    clearClipboard () {
      clipboardContents = ''
    },
    canPaste () {
      return true
    }
  }
}

createApp(App)
  .use(i18n)
  .use(createPinia())
  .mount('#app')
