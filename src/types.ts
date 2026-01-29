import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types/types'

export interface ExcalidrawData {
  elements: readonly ExcalidrawElement[]
  appState?: Partial<AppState>
  files?: BinaryFiles
}

export interface Drawing {
  id: string           // page uuid
  name: string         // page name
  tags?: string[]      // category tags for search
  data: ExcalidrawData
  thumbnail?: string   // SVG data URL for preview
  createdAt: number
  updatedAt: number
}

export type Theme = 'light' | 'dark'

export type AppMode = 'edit' | 'preview' | 'dashboard'

export interface RenderAppProps {
  mode: AppMode
  drawingId?: string
  slotId?: string
}

export interface DashboardProps {
  drawings: Drawing[]
  onOpen: (id: string) => void
  onCreate: (name: string, tags?: string[]) => Promise<Drawing | null>
  onUpdate: (id: string, updates: { name?: string; tags?: string[] }) => Promise<Drawing | null>
  onDelete: (id: string) => Promise<boolean>
  onClose: () => void
}

export interface ExcalidrawEditorProps {
  drawing: Drawing
  mode: 'edit' | 'preview'
  theme: Theme
  onSave: (drawing: Drawing) => Promise<Drawing | null>
  onBack: () => void
  onModeChange: (mode: AppMode) => void
  onClose: () => void
}
