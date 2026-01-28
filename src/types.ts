import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types/types'

export interface ExcalidrawData {
  elements: readonly ExcalidrawElement[]
  appState?: Partial<AppState>
  files: BinaryFiles | null
}

export interface Drawing {
  id: string           // page uuid
  name: string         // page name
  tag?: string         // category tag
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
