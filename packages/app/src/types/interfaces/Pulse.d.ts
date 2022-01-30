declare global {
  interface Pulse {
    id: string
    update: (ticks: number) => void
    hasGeometry: boolean
    segments?: Point[]
    width?: number
  }
}

export default Pulse
