import type { Plan, PerimeterGroup, CounterGroup, AnnotationZone, Note } from '../types'
import type { Calibration } from '../App'
import type { Project } from '../components/StartupMenu'

export interface KutchSaveData {
  version: '1'
  savedAt: string
  project: Project
  perimeterGroups: PerimeterGroup[]
  counterGroups: CounterGroup[]
  calibration: Calibration | null
  activePlanId: string | null
  plans: Array<{
    id: string
    name: string
    importedAt: string
    fileName?: string
    fileData?: string  // base64 data URL of the PDF
  }>
  zones?: AnnotationZone[]   // optional for backwards compat
  notes?: Note[]
}

const AUTOSAVE_KEY = 'kutch_autosave_v1'

// ── File ↔ Base64 ─────────────────────────────────────────────────────────────

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
  })

export const base64ToFile = (dataUrl: string, fileName: string): File => {
  const [header, data] = dataUrl.split(',')
  const mimeMatch = header.match(/:(.*?);/)
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf'
  const byteString = atob(data)
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
  return new File([ab], fileName, { type: mimeType })
}

// ── Save to .kutch file ────────────────────────────────────────────────────────

export const saveProjectFile = async (
  project: Project,
  plans: Plan[],
  perimeterGroups: PerimeterGroup[],
  counterGroups: CounterGroup[],
  calibration: Calibration | null,
  activePlanId: string | null,
  customFileName?: string,
  zones?: AnnotationZone[],
  notes?: Note[]
) => {
  const planData = await Promise.all(
    plans.map(async p => ({
      id: p.id,
      name: p.name,
      importedAt: p.importedAt,
      fileName: p.file?.name,
      fileData: p.file ? await fileToBase64(p.file) : undefined,
    }))
  )

  const saveData: KutchSaveData = {
    version: '1',
    savedAt: new Date().toISOString(),
    project: { ...project, plansCount: plans.length },
    perimeterGroups,
    counterGroups,
    calibration,
    activePlanId,
    plans: planData,
    zones,
    notes,
  }

  const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const baseName = (customFileName || project.name).replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/\.kutch$/i, '')
  a.href = url
  a.download = `${baseName}.kutch`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Load from .kutch file ──────────────────────────────────────────────────────

export const loadProjectFile = async (file: File): Promise<{ data: KutchSaveData; plans: Plan[] }> => {
  const text = await file.text()
  const data: KutchSaveData = JSON.parse(text)

  const plans: Plan[] = data.plans.map(p => ({
    id: p.id,
    name: p.name,
    importedAt: p.importedAt,
    file: p.fileData && p.fileName ? base64ToFile(p.fileData, p.fileName) : undefined,
  }))

  return { data, plans }
}

// ── Auto-save to localStorage (no PDFs to stay under quota) ───────────────────

export const autoSaveToStorage = (
  project: Project,
  plans: Plan[],
  perimeterGroups: PerimeterGroup[],
  counterGroups: CounterGroup[],
  calibration: Calibration | null,
  activePlanId: string | null,
  zones?: AnnotationZone[],
  notes?: Note[]
) => {
  const data: KutchSaveData = {
    version: '1',
    savedAt: new Date().toISOString(),
    project: { ...project, plansCount: plans.length },
    perimeterGroups,
    counterGroups,
    calibration,
    activePlanId,
    // Metadata only — no fileData — PDFs loaded from IndexedDB
    plans: plans.map(p => ({ id: p.id, name: p.name, importedAt: p.importedAt })),
    zones,
    notes,
  }
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data))
  } catch {
    // Quota exceeded — silently ignore
  }
}

export const getAutoSave = (): KutchSaveData | null => {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY)
    return raw ? (JSON.parse(raw) as KutchSaveData) : null
  } catch {
    return null
  }
}

export const clearAutoSave = () => {
  localStorage.removeItem(AUTOSAVE_KEY)
}
