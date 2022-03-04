declare global {
  interface PropertySet {
    [propertyName: string]: Property
  }
}

export default PropertySet
