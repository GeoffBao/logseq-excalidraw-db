import { useCallback, useRef } from 'react'
import type { Drawing } from '../types'
import { logger } from '../lib/logger'
import { generateId, getCurrentTimestamp } from '../lib/utils'

// Use plugin sandbox storage for DB version
// This works reliably across both file and DB graphs

export function useLogseq() {
  // Cache storage instance
  const storageRef = useRef<ReturnType<typeof logseq.Assets.makeSandboxStorage> | null>(null)

  const getStorage = useCallback(() => {
    if (!storageRef.current) {
      storageRef.current = logseq.Assets.makeSandboxStorage()
    }
    return storageRef.current
  }, [])

  /**
   * Get drawings index from storage
   */
  const getIndex = useCallback(async (): Promise<string[]> => {
    try {
      const storage = getStorage()
      const indexStr = await storage.getItem('drawings-index')
      return indexStr ? JSON.parse(indexStr) : []
    } catch (e) {
      logger.error('Failed to get index:', e)
      return []
    }
  }, [getStorage])

  /**
   * Save drawings index to storage
   */
  const saveIndex = useCallback(async (index: string[]) => {
    try {
      const storage = getStorage()
      await storage.setItem('drawings-index', JSON.stringify(index))
    } catch (e) {
      logger.error('Failed to save index:', e)
    }
  }, [getStorage])

  /**
   * Load all Excalidraw drawings
   */
  const loadDrawings = useCallback(async (): Promise<Drawing[]> => {
    try {
      const storage = getStorage()
      const index = await getIndex()

      if (index.length === 0) {
        logger.debug('No drawings found')
        return []
      }

      const drawings: Drawing[] = []

      for (const id of index) {
        try {
          const drawingStr = await storage.getItem(`drawing-${id}`)
          if (drawingStr) {
            const drawing = JSON.parse(drawingStr)
            drawings.push(drawing)
          }
        } catch (e) {
          logger.warn('Failed to parse drawing:', id, e)
        }
      }

      return drawings.sort((a, b) => b.updatedAt - a.updatedAt)
    } catch (error) {
      logger.error('Failed to load drawings:', error)
      return []
    }
  }, [getStorage, getIndex])

  /**
   * Load a specific drawing by ID
   */
  const loadDrawing = useCallback(async (id: string): Promise<Drawing | null> => {
    try {
      const storage = getStorage()
      const drawingStr = await storage.getItem(`drawing-${id}`)

      if (!drawingStr) {
        logger.warn('Drawing not found:', id)
        return null
      }

      return JSON.parse(drawingStr)
    } catch (error) {
      logger.error('Failed to load drawing:', error)
      return null
    }
  }, [getStorage])

  /**
   * Create a new Excalidraw drawing
   * Also creates a Logseq page with the renderer macro for CMD+K searchability
   */
  const createDrawing = useCallback(async (name: string, tag?: string): Promise<Drawing | null> => {
    try {
      const storage = getStorage()
      const id = generateId()
      const now = getCurrentTimestamp()

      const drawing: Drawing = {
        id,
        name,
        tags: tag ? [tag] : [],
        data: { elements: [], files: undefined },
        createdAt: now,
        updatedAt: now,
      }

      // Save drawing to plugin storage
      await storage.setItem(`drawing-${id}`, JSON.stringify(drawing))

      // Update index
      const index = await getIndex()
      index.unshift(id)
      await saveIndex(index)

      logger.debug('Created drawing:', id, name)
      return drawing
    } catch (error) {
      logger.error('Failed to create drawing:', error)
      return null
    }
  }, [getStorage, getIndex, saveIndex])

  /**
   * Save drawing data
   */
  const saveDrawing = useCallback(async (drawing: Drawing): Promise<Drawing | null> => {
    try {
      const storage = getStorage()
      const now = getCurrentTimestamp()

      const updatedDrawing: Drawing = {
        ...drawing,
        updatedAt: now,
      }

      await storage.setItem(`drawing-${drawing.id}`, JSON.stringify(updatedDrawing))
      logger.debug('Saved drawing:', drawing.id)
      return updatedDrawing
    } catch (error) {
      logger.error('Failed to save drawing:', error)
      return null
    }
  }, [getStorage])

  /**
   * Update drawing metadata (name, tag)
   */
  const updateDrawingMeta = useCallback(async (
    id: string,
    updates: { name?: string; tags?: string[] }
  ): Promise<Drawing | null> => {
    try {
      const storage = getStorage()
      const drawingStr = await storage.getItem(`drawing-${id}`)

      if (!drawingStr) {
        logger.warn('Drawing not found:', id)
        return null
      }

      const drawing = JSON.parse(drawingStr) as Drawing
      const updatedDrawing: Drawing = {
        ...drawing,
        name: updates.name ?? drawing.name,
        tags: updates.tags ?? drawing.tags,
        updatedAt: getCurrentTimestamp(),
      }

      await storage.setItem(`drawing-${id}`, JSON.stringify(updatedDrawing))
      logger.debug('Updated drawing meta:', id)
      return updatedDrawing
    } catch (error) {
      logger.error('Failed to update drawing meta:', error)
      return null
    }
  }, [getStorage])

  /**
   * Delete a drawing
   */
  const deleteDrawing = useCallback(async (id: string): Promise<boolean> => {
    try {
      const storage = getStorage()

      // Remove from storage
      await storage.removeItem(`drawing-${id}`)

      // Update index
      const index = await getIndex()
      const newIndex = index.filter((i) => i !== id)
      await saveIndex(newIndex)

      logger.debug('Deleted drawing:', id)
      return true
    } catch (error) {
      logger.error('Failed to delete drawing:', error)
      return false
    }
  }, [getStorage, getIndex, saveIndex])

  /**
   * Insert drawing reference into current block
   */
  const insertDrawingReference = useCallback(async (drawingId: string) => {
    try {
      const block = await logseq.Editor.getCurrentBlock()
      if (!block) return

      await logseq.Editor.updateBlock(
        block.uuid,
        `{{renderer excalidraw, ${drawingId}}}`
      )
    } catch (error) {
      logger.error('Failed to insert reference:', error)
    }
  }, [])

  return {
    loadDrawings,
    loadDrawing,
    createDrawing,
    saveDrawing,
    updateDrawingMeta,
    deleteDrawing,
    insertDrawingReference,
  }
}
