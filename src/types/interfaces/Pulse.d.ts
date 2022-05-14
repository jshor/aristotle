declare global {
  interface Pulse {
    id: string
    update: (elapsed: number) => void
    segments?: Point[]
    width?: number
    hue?: number
  }
}

export default Pulse
