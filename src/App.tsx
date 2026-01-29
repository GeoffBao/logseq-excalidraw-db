import { useState, useEffect, useCallback } from 'react'
import { ExcalidrawEditor } from './components/ExcalidrawEditor'
import { Dashboard } from './components/Dashboard'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useLogseq } from './hooks/useLogseq'
import { useTheme } from './hooks/useTheme'
import { refreshSearchIndex, updateDrawingCommands, rememberCurrentPage } from './lib/plugin'
import { logger } from './lib/logger'
import type { RenderAppProps, Drawing, AppMode } from './types'

interface AppProps extends RenderAppProps { }

export default function App({ mode: initialMode, drawingId }: AppProps) {
  const [mode, setMode] = useState<AppMode>(initialMode)
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null)
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { theme } = useTheme()
  const { loadDrawings, loadDrawing, saveDrawing, createDrawing, updateDrawingMeta, deleteDrawing } = useLogseq()

  // Load drawings on mount
  useEffect(() => {
    setIsLoading(true)
    loadDrawings()
      .then(setDrawings)
      .finally(() => setIsLoading(false))
  }, [loadDrawings])

  // Refresh search index and update commands when drawings change
  useEffect(() => {
    if (drawings.length > 0 || !isLoading) {
      refreshSearchIndex(drawings)
      // Update command palette entries for quick access
      updateDrawingCommands()
    }
  }, [drawings, isLoading])

  // Load specific drawing if ID provided
  useEffect(() => {
    if (drawingId) {
      loadDrawing(drawingId).then((drawing) => {
        if (drawing) {
          setCurrentDrawing(drawing)
          setMode('edit')
        }
      })
    }
  }, [drawingId, loadDrawing])

  const handleCreateDrawing = useCallback(async (name: string, tags?: string[]) => {
    await rememberCurrentPage()
    const drawing = await createDrawing(name, tags?.[0])
    if (drawing) {
      setDrawings((prev) => [drawing, ...prev])
      setCurrentDrawing(drawing)
      setMode('edit')
    }
    return drawing
  }, [createDrawing])

  const handleOpenDrawing = useCallback(async (id: string) => {
    await rememberCurrentPage()
    const drawing = await loadDrawing(id)
    if (drawing) {
      setCurrentDrawing(drawing)
      setMode('edit')
    }
  }, [loadDrawing])

  const handleSaveDrawing = useCallback(async (drawing: Drawing) => {
    const saved = await saveDrawing(drawing)
    if (saved) {
      setCurrentDrawing(saved)
      setDrawings((prev) =>
        prev.map((d) => (d.id === saved.id ? saved : d))
      )
    }
    return saved
  }, [saveDrawing])

  const handleUpdateDrawing = useCallback(async (id: string, updates: { name?: string; tags?: string[] }) => {
    const updated = await updateDrawingMeta(id, updates)
    if (updated) {
      setDrawings((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      )
      if (currentDrawing?.id === updated.id) {
        setCurrentDrawing(updated)
      }
    }
    return updated
  }, [updateDrawingMeta, currentDrawing])

  const handleDeleteDrawing = useCallback(async (id: string) => {
    const success = await deleteDrawing(id)
    if (success) {
      setDrawings((prev) => prev.filter((d) => d.id !== id))
      if (currentDrawing?.id === id) {
        setCurrentDrawing(null)
        setMode('dashboard')
      }
    }
    return success
  }, [deleteDrawing, currentDrawing])

  const handleBackToDashboard = useCallback(() => {
    logger.debug('handleBackToDashboard called')
    setCurrentDrawing(null)
    setMode('dashboard')
    // Reload drawings list
    loadDrawings().then(setDrawings)
  }, [loadDrawings])

  const handleClose = useCallback(async () => {
    logger.debug('handleClose called')

    try {
      // Hide the main UI
      logseq.hideMainUI()

      // Fallback: reload page if needed
      const currentPage = await logseq.Editor.getCurrentPage()
      if (currentPage?.name) {
        logseq.App.pushState('page', { name: currentPage.name })
      }
    } catch (e) {
      logger.error('handleClose error:', e)
      logseq.hideMainUI()
    }
  }, [])

  return (
    <ErrorBoundary>
      <div className={`excalidraw-app ${theme}`} data-theme={theme}>
        {isLoading ? (
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Loading drawings...</p>
            </div>
          </div>
        ) : mode === 'dashboard' ? (
          <Dashboard
            drawings={drawings}
            onOpen={handleOpenDrawing}
            onCreate={handleCreateDrawing}
            onUpdate={handleUpdateDrawing}
            onDelete={handleDeleteDrawing}
            onClose={handleClose}
          />
        ) : (mode === 'edit' || mode === 'preview') && currentDrawing ? (
          <ExcalidrawEditor
            drawing={currentDrawing}
            mode={mode}
            theme={theme}
            onSave={handleSaveDrawing}
            onBack={handleBackToDashboard}
            onModeChange={setMode}
            onClose={handleClose}
          />
        ) : null}
      </div>
    </ErrorBoundary>
  )
}
