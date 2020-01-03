export default interface IPulse {
  id: string
  update: (ticks: number) => void
  hasGeometry: boolean
  segments?: Point[]
  width?: number
}
