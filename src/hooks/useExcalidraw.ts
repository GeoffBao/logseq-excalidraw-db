import { useState, useCallback, useRef, useEffect } from 'react'
import type { ExcalidrawData, Drawing } from '../types'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types'
import { logger } from '../lib/logger'

interface UseExcalidrawOptions {
  drawing: Drawing
  onSave?: (drawing: Drawing) => Promise<Drawing | null>
  autoSaveInterval?: number
  tagsRef?: React.RefObject<string[]>  // Optional ref for dynamic tags
}

export function useExcalidraw({
  drawing,
  onSave,
  autoSaveInterval = 5000,
  tagsRef,
}: UseExcalidrawOptions) {
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Store hash of last saved data to compare
  const lastSavedHashRef = useRef<string>('')
  // Flag to prevent save during initial load
  const isInitializedRef = useRef(false)

  // Use refs to avoid stale closure issues
  const drawingRef = useRef(drawing)
  const onSaveRef = useRef(onSave)

  // Keep refs updated
  drawingRef.current = drawing
  onSaveRef.current = onSave

  // Simple hash function for comparing data
  const getDataHash = useCallback((elements: readonly any[]): string => {
    // Just use element count and a few key properties for quick comparison
    if (!elements || elements.length === 0) return 'empty'
    const summary = elements.map(e => `${e.id}:${e.type}:${e.x}:${e.y}:${e.version || 0}`).join('|')
    return summary
  }, [])

  const setExcalidrawAPI = useCallback((api: ExcalidrawImperativeAPI) => {
    excalidrawAPIRef.current = api
    // Initialize hash with current drawing data
    if (drawingRef.current.data.elements) {
      lastSavedHashRef.current = getDataHash(drawingRef.current.data.elements as readonly any[])
      logger.debug('Initialized hash:', lastSavedHashRef.current)
    }
    // Mark as initialized after a short delay to ignore initial onChange events
    setTimeout(() => {
      isInitializedRef.current = true
      logger.debug('Component initialized')
    }, 1000)
  }, [getDataHash])

  // Track mount state to prevent memory leaks in async operations
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Clear auto-save timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }
      // Reset initialized flag
      isInitializedRef.current = false
      logger.debug('Cleanup on unmount')
    }
  }, [])

  const getExcalidrawData = useCallback((): ExcalidrawData | null => {
    const api = excalidrawAPIRef.current
    if (!api) return null

    const elements = api.getSceneElements()
    const appState = api.getAppState()
    const files = api.getFiles()

    return {
      elements,
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize,
      },
      files,
    }
  }, [])

  const handleChange = useCallback(() => {
    const api = excalidrawAPIRef.current
    if (!api) return

    // Don't process changes until component is fully initialized
    if (!isInitializedRef.current) {
      return
    }

    // Get current data hash
    const elements = api.getSceneElements()
    const currentHash = getDataHash(elements)

    // Only mark dirty if data actually changed from last save
    if (currentHash !== lastSavedHashRef.current) {
      setIsDirty(true)

      // Reset auto-save timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      if (autoSaveInterval > 0) {
        autoSaveTimerRef.current = setTimeout(async () => {
          if (!isMountedRef.current) return

          const data = getExcalidrawData()
          if (data && onSaveRef.current) {
            setIsSaving(true)
            try {
              // Generate thumbnail for auto-save too
              const thumbnail = await generateThumbnailRef.current()

              if (!isMountedRef.current) return

              const result = await onSaveRef.current({
                ...drawingRef.current,
                data,
                thumbnail: thumbnail || undefined,
                // Include updated tags if provided
                ...(tagsRef?.current ? { tags: tagsRef.current } : {}),
              })

              if (!isMountedRef.current) return

              if (result) {
                // Update saved hash
                lastSavedHashRef.current = getDataHash(data.elements as readonly any[])
                setIsDirty(false)
                setLastSaved(new Date())
              }
            } catch (error) {
              if (isMountedRef.current) {
                logger.error('Auto-save failed:', error)
              }
            } finally {
              if (isMountedRef.current) {
                setIsSaving(false)
              }
            }
          }
        }, autoSaveInterval)
      }
    }
  }, [autoSaveInterval, getExcalidrawData, getDataHash])

  // Forward declare generateThumbnail for use in saveNow
  const generateThumbnailRef = useRef<() => Promise<string | null>>(() => Promise.resolve(null))

  const saveNow = useCallback(async (): Promise<boolean> => {
    if (!onSaveRef.current) {
      logger.debug('saveNow: no onSave callback')
      return false
    }

    const data = getExcalidrawData()
    if (!data) {
      logger.debug('saveNow: no data')
      return false
    }

    logger.debug('saveNow: saving...')
    setIsSaving(true)

    // Clear any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }

    try {
      // Generate thumbnail
      const thumbnail = await generateThumbnailRef.current()

      const result = await onSaveRef.current({
        ...drawingRef.current,
        data,
        thumbnail: thumbnail || undefined,
        // Include updated tags if provided
        ...(tagsRef?.current ? { tags: tagsRef.current } : {}),
      })
      logger.debug('saveNow: save result', !!result)
      if (result) {
        // Update saved hash so we know what was last saved
        lastSavedHashRef.current = getDataHash(data.elements as readonly any[])
        setIsDirty(false)
        setLastSaved(new Date())
        logger.debug('saveNow: isDirty set to false, hash updated')
      }
      return !!result
    } catch (error) {
      logger.error('Save failed:', error)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [getExcalidrawData, getDataHash])

  const exportToSVG = useCallback(async (): Promise<string | null> => {
    const api = excalidrawAPIRef.current
    if (!api) return null

    try {
      const { exportToSvg } = await import('@excalidraw/excalidraw')
      const elements = api.getSceneElements()
      const appState = api.getAppState()
      const files = api.getFiles()

      const svg = await exportToSvg({
        elements,
        appState: {
          ...appState,
          exportWithDarkMode: false,
        },
        files,
      })

      return svg.outerHTML
    } catch (error) {
      logger.error('Export to SVG failed:', error)
      return null
    }
  }, [])

  /**
   * Generate a thumbnail SVG for preview
   */
  const generateThumbnail = useCallback(async (): Promise<string | null> => {
    const api = excalidrawAPIRef.current
    if (!api) return null

    try {
      const { exportToSvg } = await import('@excalidraw/excalidraw')
      const elements = api.getSceneElements()

      // Skip if no elements
      if (!elements || elements.length === 0) return null

      const files = api.getFiles()

      const svg = await exportToSvg({
        elements,
        appState: {
          exportWithDarkMode: false,
          exportBackground: true,
          viewBackgroundColor: '#ffffff',
        },
        files,
      })

      // Convert to data URL
      const svgString = svg.outerHTML
      const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`
      return dataUrl
    } catch (error) {
      logger.error('Generate thumbnail failed:', error)
      return null
    }
  }, [])

  // Update ref so saveNow can use it
  generateThumbnailRef.current = generateThumbnail

  const exportToPNG = useCallback(async (): Promise<Blob | null> => {
    const api = excalidrawAPIRef.current
    if (!api) return null

    try {
      const { exportToBlob } = await import('@excalidraw/excalidraw')
      const elements = api.getSceneElements()
      const appState = api.getAppState()
      const files = api.getFiles()

      const blob = await exportToBlob({
        elements,
        appState,
        files,
        mimeType: 'image/png',
      })

      return blob
    } catch (error) {
      logger.error('Export to PNG failed:', error)
      return null
    }
  }, [])

  const downloadImage = useCallback(async (filename: string = 'drawing') => {
    const blob = await exportToPNG()
    if (!blob) return

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [exportToPNG])

  return {
    isDirty,
    isSaving,
    lastSaved,
    setExcalidrawAPI, // This can be used as the ref prop for <Excalidraw />
    excalidrawAPI: excalidrawAPIRef.current,
    handleChange,
    saveNow,
    exportToSVG,
    exportToPNG,
    exportToImage: exportToPNG,
    downloadImage,
  }
}
