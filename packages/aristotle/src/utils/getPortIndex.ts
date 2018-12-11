import draw2d from 'draw2d'

const getPortIndex = (port: draw2d.Port, type: string): number => {
  const ports = port.parent[`${type}Ports`].data

  for (let i = 0; i < ports.length; i++) {
    if (ports[i] === port) {
      return i
    }
  }
  return -1
}

export default getPortIndex
