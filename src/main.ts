import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from '@/App.vue'
import '@/styles/main.scss'

if (!window.api) {
  // stub the ipc api for non-electron environments
  // TODO: once the app is fully electron, move this to jest setup file
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
  .use(createPinia())
  .mount('#app')
