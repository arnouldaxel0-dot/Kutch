export interface Point { x: number; y: number }

export interface PerimeterPath {
  id: string
  points: Point[]
  length: number // pixel length
}

export interface PerimeterGroup {
  id: string
  name: string
  color: string
  thickness: number
  height?: number
  width?: number
  paths: PerimeterPath[]
  totalLength: number // sum of all path lengths
}

export interface Plan {
  id: string
  name: string
  importedAt: string
  file?: File
}

export interface SelectedElement {
  type: 'perimeter'
  groupId: string
  pathId: string
}
