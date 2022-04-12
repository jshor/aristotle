declare global {
  interface Pulse {
    id: string
    update: (ticks: number) => void
    hasGeometry: boolean
    segments?: Point[]
    width?: number
    hue?: number
  }
}

export default Pulse
