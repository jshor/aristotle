/**
 * Returns a unique, sequenced name based on the given name and a set of existing names.
 */
export function getSequencedName (name: string, names: Set<string>) {
  let newName = name
  let index = 1

  while (names.has(newName)) {
    newName = `${name} ${++index}`
  }

  names.add(newName)

  return newName
}
