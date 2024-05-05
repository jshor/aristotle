import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from '@/App.vue'
import { i18n } from '@/utils/i18n'
import '@/styles/main.scss'

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
    setFullscreen () {},
    getFilePaths () { return [] },
    getDefaultSavePath () { return ''},
    setClipboardContents () {},
    getClipboardContents () { return '' },
    clearClipboard () {},
    canPaste () { return false }
  }
}

createApp(App)
  .use(i18n)
  .use(createPinia())
  .mount('#app')
