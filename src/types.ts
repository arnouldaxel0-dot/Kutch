export interface Point { x: number; y: number }

export interface PerimeterPath {
  id: string
  points: Point[]
  length: number // pixel length (or area in px² for surface)
}

export interface PerimeterGroup {
  id: string
  name: string
  type: 'perimeter' | 'surface' | 'distance'
  color: string
  thickness: number               // line display thickness (1–4)
  elementThickness?: number       // physical thickness in meters
  height?: number
  width?: number
  articleCCTP?: string
  deduction?: number
  pricePerM2?: number
  pricePerM3?: number
  pricePerML?: number
  paths: PerimeterPath[]
  totalLength: number             // for perimeter/distance: length; for surface: area in px²
}

export interface Plan {
  id: string
  name: string
  importedAt: string
  file?: File
}

export interface SelectedElement {
  type: 'perimeter' | 'surface' | 'distance' | 'counter'
  groupId: string
  pathId: string
}

export interface CounterMarker {
  id: string
  number: number  // smart assigned number (fills gaps)
  point: Point
}

export interface CounterGroup {
  id: string
  name: string
  color: string
  markers: CounterMarker[]
}
