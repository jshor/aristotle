import Direction from "@/types/enums/Direction";
import Item from "@/types/interfaces/Item";
import idMapper from "@/utils/idMapper";

export default function customCircuitFactory (item: Item) {
  item = idMapper.mapIntegratedCircuitIds(item)

  const integratedCircuit = item.integratedCircuit!
  const ports = item
    .portIds
    .reduce((ports, id) => {
      const port = integratedCircuit.ports[id]

      return {
        ...ports,
        [port.orientation]: [
          ...ports[port.orientation],
          port
        ]
      }
    }, {
      [Direction.Left]: [],
      [Direction.Right]: [],
      [Direction.Top]: [],
      [Direction.Bottom]: []
    })

  item.name = item.defaultName

  return { item, ports }
}
