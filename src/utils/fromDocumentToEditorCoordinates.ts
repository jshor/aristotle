export default function fromDocumentToEditorCoordinates (canvas: BoundingBox, viewport: DOMRect, point: Point, z: number) {
  return {
    x: (point.x - viewport.x - canvas.left) / z,
    y: (point.y - viewport.y - canvas.top) / z
  }
}
