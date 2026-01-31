import { useCallback, useState, useRef, useEffect } from 'react'
import { Excalidraw, WelcomeScreen } from '@excalidraw/excalidraw'

import { useExcalidraw } from '../hooks/useExcalidraw'
import { cn } from '../lib/utils'
import { logger } from '../lib/logger'
import { copyDrawingReference, insertDrawingToToday } from '../lib/plugin'
import type { ExcalidrawEditorProps } from '../types'
import { EditorHeader } from './editor/EditorHeader'
import { TagEditorPopover } from './editor/TagEditorPopover'

// ========================================
// FONT REGISTRATION (JavaScript FontFace API)
// Excalidraw renders on Canvas, which IGNORES CSS @font-face.
// We MUST register fonts via JavaScript for Canvas to use them.
// ========================================
// Use local fonts (downloaded to public/fonts) to avoid CDN/CORS issues
// Note: In Vite, files in public/ are served at root path
const VIRGIL_LOCAL_URL = '/fonts/Virgil.woff2';
const XIAOLAI_LOCAL_URL = '/fonts/Xiaolai.woff2';

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
  const [fontsLoaded, setFontsLoaded] = useState(false) // BLOCKING STATE

  // Canvas State
  const [zenModeEnabled, setZenModeEnabled] = useState(false)
  const [gridModeEnabled, setGridModeEnabled] = useState(false)

  const tagsRef = useRef<string[]>(currentTags)

  // Update tagsRef when currentTags change
  useEffect(() => {
    tagsRef.current = currentTags
  }, [currentTags])

  // Register fonts via JavaScript FontFace API (Blocking)
  useEffect(() => {
    async function loadFonts() {
      try {
        const fontsToLoad: Promise<FontFace>[] = [];

        // 1. Virgil (Latin)
        const virgil = new FontFace('Virgil', `url(${VIRGIL_LOCAL_URL})`, {
          style: 'normal',
          weight: '400',
          unicodeRange: 'U+0000-00FF, U+0100-017F, U+2000-206F'
        });
        fontsToLoad.push(virgil.load());

        // 2. Xiaolai (CJK)
        const xiaolai = new FontFace('Virgil', `url(${XIAOLAI_LOCAL_URL})`, {
          style: 'normal',
          weight: '400',
          unicodeRange: 'U+3000-30FF, U+4E00-9FFF, U+FF00-FFEF'
        });
        fontsToLoad.push(xiaolai.load());

        const loadedFonts = await Promise.all(fontsToLoad);
        loadedFonts.forEach(font => document.fonts.add(font));

        // Wait for document to confirm availability
        await document.fonts.ready;

        logger.info('[Font] Fonts registered locally. Unblocking UI.');
        setFontsLoaded(true);
      } catch (error) {
        logger.error('[Font] Failed to load local fonts:', error);
        // Even if failed, unblock so user can see something (fallback)
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  // Block rendering until fonts are ready to prevent "Canvas Race Condition"
  if (!fontsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-white dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }


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
        onClose={onClose}
        // New Props
        zenModeEnabled={zenModeEnabled}
        onZenModeChange={setZenModeEnabled}
        gridModeEnabled={gridModeEnabled}
        onGridModeChange={setGridModeEnabled}
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
            zenModeEnabled={zenModeEnabled}
            gridModeEnabled={gridModeEnabled}
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
    </div>
  )
}
