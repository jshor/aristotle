import WindowApi from '@/types/interfaces/WindowApi'

declare global {
  interface Window {
    api: WindowApi
  }
}
