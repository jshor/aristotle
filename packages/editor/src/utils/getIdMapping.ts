import uuid from './uuid'

export default function getIdMapping (nodes) {
  return nodes.reduce((map, { id }) => ({
    ...map,
    [id]: uuid()
  }), {})
}
