/**
 * Plugin registration for Logseq DB version
 */

import type { Drawing } from '../types'
import { logger } from './logger'

// Store callbacks
let openExcalidrawCallback: ((drawingId?: string) => void) | null = null
let getDrawingCallback: ((id: string) => Promise<any>) | null = null
let loadAllDrawingsCallback: (() => Promise<Drawing[]>) | null = null

// Prefix for excalidraw drawing IDs (to identify in search results)
const EXCALIDRAW_UUID_PREFIX = 'excalidraw-drawing-'

export function setOpenCallback(callback: (drawingId?: string) => void) {
  openExcalidrawCallback = callback
}

export function setGetDrawingCallback(callback: (id: string) => Promise<any>) {
  getDrawingCallback = callback
}

export function setLoadAllDrawingsCallback(callback: () => Promise<Drawing[]>) {
  loadAllDrawingsCallback = callback
}

/**
 * Refresh the search index with latest drawings
 * Note: Search service is disabled, this just logs for debugging
 */
export function refreshSearchIndex(drawings: Drawing[]) {
  logger.debug('Drawings count:', drawings.length)
}

/**
 * Check if a UUID is an excalidraw drawing
 */
export function isExcalidrawUUID(uuid: string): boolean {
  return uuid.startsWith(EXCALIDRAW_UUID_PREFIX)
}

/**
 * Extract the real drawing ID from the prefixed UUID
 */
export function extractDrawingId(uuid: string): string {
  return uuid.replace(EXCALIDRAW_UUID_PREFIX, '')
}

// Register main commands
export function registerCommands(openCallback: (drawingId?: string) => void) {
  openExcalidrawCallback = openCallback

  // Command: Open Excalidraw Dashboard
  logseq.App.registerCommandPalette(
    {
      key: 'excalidraw:open-dashboard',
      label: 'Excalidraw: Open Dashboard',
      keybinding: {
        binding: 'mod+shift+e',
        mode: 'global',
      },
    },
    () => {
      logger.debug('Opening dashboard via command palette')
      openCallback()
    }
  )

  // Command: Create new drawing
  logseq.App.registerCommandPalette(
    {
      key: 'excalidraw:new-drawing',
      label: 'Excalidraw: New Drawing',
    },
    () => {
      logger.debug('Creating new drawing')
      openCallback()
    }
  )

  // Register dynamic commands for each drawing (will be updated when drawings change)
  registerDrawingCommands()
}

/**
 * Register command palette entries for each drawing
 * This enables quick access via CMD+K
 */
let registeredDrawingCommands: string[] = []

export function registerDrawingCommands() {
  // Will be called when search index refreshes
}

/**
 * Update command palette entries when drawings change
 */
export async function updateDrawingCommands() {
  // First unregister old commands
  // Note: Logseq doesn't have unregister API, so we just track what we've registered

  if (!loadAllDrawingsCallback) return

  try {
    const drawings = await loadAllDrawingsCallback()

    // Register a command for each drawing (limit to recent 20)
    const recentDrawings = drawings.slice(0, 20)

    for (const drawing of recentDrawings) {
      const commandKey = `excalidraw:open-${drawing.id}`

      // Skip if already registered
      if (registeredDrawingCommands.includes(commandKey)) continue

      // Capture drawing info for the closure
      const drawingId = drawing.id
      const drawingName = drawing.name

      try {
        logseq.App.registerCommandPalette(
          {
            key: commandKey,
            label: `Excalidraw: 打开「${drawingName}」${drawing.tag ? ` [${drawing.tag}]` : ''}`,
          },
          // Use a simple function, not async, to avoid potential issues
          () => {
            logger.debug('=== Command palette clicked ===')
            logger.debug('drawingId:', drawingId)

            // Always use event dispatch for reliability
            window.dispatchEvent(new CustomEvent('excalidraw:open', { detail: { drawingId } }))
          }
        )

        registeredDrawingCommands.push(commandKey)
        logger.debug('Registered command:', commandKey)
      } catch (e) {
        logger.error('Failed to register command:', commandKey, e)
      }
    }

    logger.debug('Drawing commands updated, count:', recentDrawings.length)
  } catch (e) {
    logger.warn('Failed to update drawing commands:', e)
  }
}

// Register slash commands
export function registerSlashCommands() {
  // /excalidraw - open excalidraw dashboard
  logseq.Editor.registerSlashCommand('Excalidraw', async () => {
    if (openExcalidrawCallback) {
      openExcalidrawCallback()
    }
  })
}

// Register block renderers
export function registerBlockRenderers() {
  // Renderer for inline excalidraw drawings
  logseq.App.onMacroRendererSlotted(async ({ slot, payload }) => {
    const [type, ...args] = payload.arguments

    if (type !== 'excalidraw') return

    const drawingId = args[0]?.trim()
    if (!drawingId) return

    // Try to get drawing info for thumbnail
    let drawingName = 'Excalidraw Drawing'
    let thumbnail = ''

    if (getDrawingCallback) {
      try {
        const drawing = await getDrawingCallback(drawingId)
        if (drawing) {
          drawingName = drawing.name || drawingName
          thumbnail = drawing.thumbnail || ''
        }
      } catch (e) {
        logger.warn('Failed to get drawing info:', e)
      }
    }

    // Render a preview card for the drawing
    const thumbnailHtml = thumbnail
      ? `<img src="${thumbnail}" alt="${drawingName}" style="max-width: 100%; max-height: 120px; object-fit: contain;" />`
      : `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.5;">
          <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
          <path d="M2 2l7.586 7.586"></path>
        </svg>`

    logseq.provideUI({
      key: `excalidraw-${slot}`,
      slot,
      template: `
        <div class="excalidraw-block-renderer" data-drawing-id="${drawingId}" data-slot="${slot}" style="
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 16px;
          background: var(--ls-tertiary-background-color, #f8f9fa);
          border: 1px solid var(--ls-border-color, #e1e4e8);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 150px;
          max-width: 300px;
        " onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'; this.style.borderColor='#a855f7';" 
           onmouseout="this.style.boxShadow='none'; this.style.borderColor='var(--ls-border-color, #e1e4e8)';">
          <div style="display: flex; align-items: center; justify-content: center; min-height: 60px; margin-bottom: 8px;">
            ${thumbnailHtml}
          </div>
          <div style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ls-primary-text-color, #333);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
            </svg>
            <span style="font-weight: 500;">${drawingName}</span>
          </div>
        </div>
      `,
    })

    // Add click handler after a short delay to ensure DOM is ready
    setTimeout(() => {
      const el = parent.document.querySelector(`[data-slot="${slot}"][data-drawing-id="${drawingId}"]`)
      if (el && !el.hasAttribute('data-click-bound')) {
        el.setAttribute('data-click-bound', 'true')
        el.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          logger.debug('Block renderer clicked, opening:', drawingId)
          if (openExcalidrawCallback) {
            openExcalidrawCallback(drawingId)
          }
        })
      }
    }, 100)
  })
}

/**
 * Register search service via Command Palette
 * Note: Logseq's search service API is limited, so we use Command Palette commands
 * which provides reliable search and click handling through CMD+K
 */
export function registerSearchService() {
  // The search functionality is provided through:
  // 1. Command palette commands (registered per drawing in updateDrawingCommands)
  // 2. Route change handler (setupSearchResultHandler) for navigation interception
  // This approach ensures drawings are searchable and clickable via CMD+K

  logger.info('Search enabled via Command Palette - use CMD+K to find drawings')
}

/**
 * Setup route change listener to intercept excalidraw search result clicks
 */
export function setupSearchResultHandler() {
  // Listen for route changes to intercept excalidraw drawing navigation
  logseq.App.onRouteChanged(async ({ path, template }) => {
    logger.debug('Route changed:', path, template)

    // Check if navigating to an excalidraw drawing from search
    // The path might be /page/excalidraw-drawing-xxx
    const match = path.match(/\/page\/(excalidraw-drawing-[a-zA-Z0-9]+)/)
    if (match && match[1]) {
      const prefixedId = match[1]
      if (isExcalidrawUUID(prefixedId)) {
        const drawingId = extractDrawingId(prefixedId)
        logger.debug('Intercepted search result click, opening drawing:', drawingId)

        // Slight delay to let Logseq finish its navigation attempt
        setTimeout(() => {
          if (openExcalidrawCallback) {
            openExcalidrawCallback(drawingId)
          }
        }, 50)
      }
    }
  })

  logger.debug('Search result handler setup')
}

// Store the page context when opening Excalidraw
let lastVisitedPageUuid: string | null = null
let lastVisitedPageName: string | null = null

/**
 * Remember the current page before opening Excalidraw
 */
export async function rememberCurrentPage() {
  try {
    const page = await logseq.Editor.getCurrentPage()
    if (page) {
      lastVisitedPageUuid = page.uuid as string
      lastVisitedPageName = (page.originalName || page.name || 'Unknown') as string
      logger.debug('Remembered page:', lastVisitedPageName)
    }
  } catch (e) {
    logger.warn('Failed to remember page:', e)
  }
}

/**
 * Get the renderer macro for a drawing (includes name for searchability)
 */
export function getDrawingRendererMacro(drawingId: string, drawingName?: string): string {
  if (drawingName) {
    return `🎨 ${drawingName} {{renderer excalidraw, ${drawingId}}}`
  }
  return `{{renderer excalidraw, ${drawingId}}}`
}

/**
 * Copy drawing reference to clipboard (includes name for searchability)
 */
export async function copyDrawingReference(drawingId: string, drawingName: string): Promise<boolean> {
  try {
    const macro = getDrawingRendererMacro(drawingId, drawingName)
    await navigator.clipboard.writeText(macro)
    logseq.UI.showMsg(`已复制「${drawingName}」引用到剪贴板`, 'success')
    return true
  } catch (error) {
    logger.error('Failed to copy reference:', error)
    logseq.UI.showMsg('复制失败', 'error')
    return false
  }
}

/**
 * Insert drawing reference into last visited page (includes name for searchability)
 */
export async function insertDrawingToLastPage(drawingId: string, drawingName: string): Promise<boolean> {
  try {
    if (!lastVisitedPageUuid) {
      logseq.UI.showMsg('没有找到上次访问的页面，请复制引用后手动粘贴', 'warning')
      return false
    }

    const macro = getDrawingRendererMacro(drawingId, drawingName)
    await logseq.Editor.insertBlock(
      lastVisitedPageUuid,
      macro,
      { sibling: false }
    )
    logseq.UI.showMsg(`已插入「${drawingName}」到页面「${lastVisitedPageName}」`, 'success')
    return true
  } catch (error) {
    logger.error('Failed to insert drawing:', error)
    logseq.UI.showMsg('插入失败', 'error')
    return false
  }
}

/**
 * Insert drawing reference into current block (includes name for searchability)
 */
export async function insertDrawingToBlock(drawingId: string, drawingName: string): Promise<boolean> {
  try {
    const macro = getDrawingRendererMacro(drawingId, drawingName)
    const block = await logseq.Editor.getCurrentBlock()
    if (!block) {
      // Try to get current page and insert at end
      const page = await logseq.Editor.getCurrentPage()
      if (page) {
        await logseq.Editor.insertBlock(
          page.uuid,
          macro,
          { sibling: false }
        )
        logseq.UI.showMsg(`已插入画布「${drawingName}」`, 'success')
        return true
      }
      logseq.UI.showMsg('请先选择一个 block', 'warning')
      return false
    }

    // Insert as sibling block below current block
    await logseq.Editor.insertBlock(
      block.uuid,
      macro,
      { sibling: true }
    )
    logseq.UI.showMsg(`已插入画布「${drawingName}」`, 'success')
    return true
  } catch (error) {
    logger.error('Failed to insert drawing:', error)
    logseq.UI.showMsg('插入失败', 'error')
    return false
  }
}

/**
 * Insert drawing reference into today's journal
 */
export async function insertDrawingToToday(drawingId: string, drawingName: string): Promise<boolean> {
  try {
    const userConfigs = await logseq.App.getUserConfigs()
    const preferredDateFormat = userConfigs.preferredDateFormat || 'MMM do, yyyy'

    // Simple date formatter
    const today = new Date()
    const yyyy = today.getFullYear()
    const MM = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const do_ = today.getDate() + (['st', 'nd', 'rd'][((today.getDate() + 90) % 100 - 10) % 10 - 1] || 'th')
    const MMM = today.toLocaleString('en-US', { month: 'short' })

    let pageName = ''

    // Naively handling common formats
    if (preferredDateFormat.includes('yyyy') && preferredDateFormat.includes('MM') && preferredDateFormat.includes('dd')) {
      // Only support standard dash/slash separators if needed, but for now fallback to yyyy-MM-dd if complex
      // Actually, we should just assume ISO for now if we can't parse perfectly
      pageName = `${yyyy}-${MM}-${dd}`
      if (preferredDateFormat === 'MM-dd-yyyy') pageName = `${MM}-${dd}-${yyyy}`
      if (preferredDateFormat === 'dd-MM-yyyy') pageName = `${dd}-${MM}-${yyyy}`
      if (preferredDateFormat === 'yyyy/MM/dd') pageName = `${yyyy}/${MM}/${dd}`
    } else if (preferredDateFormat.includes('MMM do, yyyy')) {
      pageName = `${MMM} ${do_}, ${yyyy}`
    } else {
      pageName = `${yyyy}-${MM}-${dd}` // Fallback default
    }

    const macro = getDrawingRendererMacro(drawingId, drawingName)

    // Insert to the page
    const page = await logseq.Editor.createPage(pageName, {}, { createFirstBlock: true, journal: true, redirect: false })
    if (page) {
      await logseq.Editor.insertBlock(
        page.uuid,
        macro,
        { sibling: false } // Insert as last block
      )
      logseq.UI.showMsg(`已插入「${drawingName}」到今日日记`, 'success')
      return true
    }

    return false

  } catch (error) {
    logger.error('Failed to insert to today:', error)
    logseq.UI.showMsg('插入失败', 'error')
    return false
  }
}

/**
 * Get last visited page info
 */
export function getLastVisitedPage(): { uuid: string; name: string } | null {
  if (lastVisitedPageUuid && lastVisitedPageName) {
    return { uuid: lastVisitedPageUuid, name: lastVisitedPageName }
  }
  return null
}
