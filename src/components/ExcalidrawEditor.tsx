import { useCallback, useState, useRef, useEffect } from 'react'
import { Excalidraw, WelcomeScreen } from '@excalidraw/excalidraw'

import { useExcalidraw } from '../hooks/useExcalidraw'
import { cn } from '../lib/utils'
import { logger } from '../lib/logger'
import { copyDrawingReference, insertDrawingToToday } from '../lib/plugin'
import type { ExcalidrawEditorProps } from '../types'
import { EditorHeader } from './editor/EditorHeader'

export function ExcalidrawEditor({
  drawing,
  mode,
  theme,
  onSave,
  onBack,
  onModeChange,
  onClose
}: ExcalidrawEditorProps) {
  const [currentTags, setCurrentTags] = useState<string[]>(drawing.tags || [])
  const [isSaving, setIsSaving] = useState(false)
  const [isJustSaved, setIsJustSaved] = useState(false)
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false)
  const tagsRef = useRef<string[]>(currentTags)

  // Update tagsRef when currentTags change
  useEffect(() => {
    tagsRef.current = currentTags
  }, [currentTags])

  const {
    setExcalidrawAPI,
    handleChange,
    saveNow,
    downloadImage,
    isDirty
  } = useExcalidraw({
    drawing,
    onSave: async (data) => {
      setIsSaving(true)
      try {
        const result = await onSave(data)
        if (result) {
          setIsJustSaved(true)
          setTimeout(() => setIsJustSaved(false), 2000)
        }
        return result
      } finally {
        setIsSaving(false)
      }
    },
    tagsRef
  })

  const handleCopyRef = useCallback(() => {
    copyDrawingReference(drawing.id, drawing.name)
  }, [drawing.id, drawing.name])

  const handleInsertToJournal = useCallback(async () => {
    await insertDrawingToToday(drawing.id, drawing.name)
  }, [drawing.id, drawing.name])

  const handleExport = useCallback(async () => {
    await downloadImage(drawing.name)
  }, [downloadImage, drawing.name])

  const handleSaveNow = useCallback(async () => {
    logger.debug('[Excalidraw] Manual save triggered')
    await saveNow()
  }, [saveNow])

  const handleUpdateTags = useCallback((newTags: string[]) => {
    setCurrentTags(newTags)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--bg-app)] flex flex-col font-sans overflow-hidden animate-in fade-in duration-300"
      onPointerDown={(e) => {
        // Only close if clicking outside the header/popovers
        const target = e.target as HTMLElement
        if (target.closest('header')) return
        setIsTagMenuOpen(false)
      }}
    >
      <EditorHeader
        drawingName={drawing.name}
        mode={mode}
        onBack={onBack}
        onSaveNow={handleSaveNow}
        isSaving={isSaving || isJustSaved}
        isJustSaved={isJustSaved}
        onCopyRef={handleCopyRef}
        onInsertJournal={handleInsertToJournal}
        onExport={handleExport}
        onModeChange={onModeChange}
        currentTags={currentTags}
        onUpdateTags={handleUpdateTags}
        isTagMenuOpen={isTagMenuOpen}
        setIsTagMenuOpen={setIsTagMenuOpen}
        isDirty={isDirty}
      />

      <main className="flex-1 relative bg-white dark:bg-[#121212]">
        <div className={cn(
          "absolute inset-0 transition-all duration-500",
          mode === 'preview' ? "pointer-events-none opacity-90 grayscale-[0.2]" : "opacity-100"
        )}>
          <Excalidraw
            excalidrawAPI={setExcalidrawAPI}
            onChange={handleChange}
            initialData={drawing.data || undefined}
            theme={theme}
            langCode="en"
            viewModeEnabled={mode === 'preview'}
            zenModeEnabled={false}
            gridModeEnabled={false}
            UIOptions={{
              canvasActions: {
                changeViewBackgroundColor: true,
                clearCanvas: true,
                export: {
                  saveFileToDisk: true,
                },
                saveAsImage: true,
              },
              tools: {
                image: true,
              },
            }}
          >
            <WelcomeScreen />
          </Excalidraw>
        </div>

        {/* Floating Save Status Mobile-style (Bottom) */}
        {(isSaving || isJustSaved) && (
          <div className={cn(
            "absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 backdrop-blur-md text-white text-xs font-bold rounded-full shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300",
            isJustSaved ? "bg-emerald-600" : "bg-black/80"
          )}>
            {isJustSaved ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Sync Success
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Syncing to Logseq...
              </>
            )}
          </div>
        )}
      </main>

      {/* Floating Close Button */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          logger.debug('[Excalidraw] Closing editor')
          onClose()
        }}
        className="fixed top-2.5 right-4 z-[70] p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-dim)] transition-all active:scale-90"
        title="Close"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
