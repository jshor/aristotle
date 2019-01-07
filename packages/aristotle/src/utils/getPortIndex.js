const getPortIndex = (port, type) => {
  const ports = port.parent[`${type}Ports`].data

  for (let i = 0; i < ports.length; i++) {
    if (ports[i] === port) {
      return i
    }
  }
  return -1
}

export default getPortIndex
