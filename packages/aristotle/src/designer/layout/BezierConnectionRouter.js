import draw2d from 'draw2d'

export default class BezierConnectionRouter extends draw2d.layout.connection.ManhattanConnectionRouter {
  route = (connection) => {
    const start = connection.getStartPoint()
    const end = connection.getEndPoint()

    const fromDir = connection
      .getSource()
      .getConnectionDirection(connection.getTarget())
    
    const toDir = connection
      .getTarget()
      .getConnectionDirection(connection.getSource())

    const x1 = start.x
    const y1 = start.y

    const x4 = end.x
    const y4 = end.y
  
    const dx = Math.max(Math.abs(x1 - x4) / 2, 10)
    const dy = Math.max(Math.abs(y1 - y4) / 2, 10)
      
    const x2 = [x1,      x1 + dx, x1,      x1 - dx][fromDir].toFixed(3)
    const y2 = [y1 - dy, y1,      y1 + dy, y1     ][fromDir].toFixed(3)
    const x3 = [x4,      x4 + dx, x4,      x4 - dx][toDir].toFixed(3)
    const y3 = [y4 - dy, y4     , y4 + dy, y4     ][toDir].toFixed(3)
  
    const path = [
      'M', x1.toFixed(3), y1.toFixed(3),
      'C', x2, y2, x3, y3, x4.toFixed(3), y4.toFixed(3)
    ].join(',')
  
    connection.addPoint(start)
    connection.addPoint(end)
    connection.svgPathString = path
  }
}