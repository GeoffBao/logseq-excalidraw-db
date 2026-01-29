import '@logseq/libs'
import { logger } from './lib/logger'

// ============================================================
// Chinese Font Support
// Strategy: We primarily rely on CSS @font-face overrides in index.css
// This JS part ensures the font resource is loaded into the browser cache
// ============================================================
const CHINESE_FONT_URL = 'https://fonts.gstatic.com/s/zcoolkuaile/v19/tssqApdaRQokwFjFJjvM6h2Wpg.woff2'

async function preloadChineseFonts() {
  try {
    const fontUrl = `url(${CHINESE_FONT_URL})`

    // 1. Load as its original name
    const zcoolFont = new FontFace('ZCOOL KuaiLe', fontUrl)
    await zcoolFont.load()
    document.fonts.add(zcoolFont)

    // 2. CRITICAL: Load as "Virgil" to force Canvas to use it for Chinese characters
    // This allows the browser to merge both "Virgil" definitions (Excalidraw's + ours)
    // or at least ensures this font is available under the name Excalidraw requests.
    // We specify unicode range to avoid overriding English Virgil if possible, 
    // though for the JS API, simpler is often better.
    const virgilChinese = new FontFace('Virgil', fontUrl, {
      unicodeRange: 'U+4E00-9FFF, U+3000-303F, U+FF00-FFEF'
    })
    await virgilChinese.load()
    document.fonts.add(virgilChinese)

    logger.debug('Chinese font preloaded and registered as Virgil successfully')
  } catch (e) {
    logger.warn('Failed to preload Chinese font:', e)
  }
}

// Start preloading immediately
preloadChineseFonts()

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import {
  registerCommands,
  registerSlashCommands,
  registerBlockRenderers,
  registerSearchService,
  setupSearchResultHandler,
  setOpenCallback,
  setGetDrawingCallback,
  setLoadAllDrawingsCallback,
  refreshSearchIndex,
  updateDrawingCommands,
  rememberCurrentPage
} from './lib/plugin'
import type { RenderAppProps, Drawing } from './types'

let root: ReactDOM.Root | null = null

// Storage helper to get drawing data
async function getDrawingFromStorage(id: string): Promise<Drawing | null> {
  try {
    const storage = logseq.Assets.makeSandboxStorage()
    const drawingStr = await storage.getItem(`drawing-${id}`)
    if (drawingStr) {
      return JSON.parse(drawingStr)
    }
  } catch (e) {
    logger.error('Failed to get drawing:', e)
  }
  return null
}

// Storage helper to load all drawings (for search)
async function loadAllDrawingsFromStorage(): Promise<Drawing[]> {
  try {
    const storage = logseq.Assets.makeSandboxStorage()
    const indexStr = await storage.getItem('drawings-index')
    const index: string[] = indexStr ? JSON.parse(indexStr) : []

    if (index.length === 0) {
      return []
    }

    const drawings: Drawing[] = []
    for (const id of index) {
      try {
        const drawingStr = await storage.getItem(`drawing-${id}`)
        if (drawingStr) {
          drawings.push(JSON.parse(drawingStr))
        }
      } catch (e) {
        logger.warn('Failed to parse drawing:', id)
      }
    }

    return drawings.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch (e) {
    logger.error('Failed to load all drawings:', e)
    return []
  }
}

// Global render function for Logseq
function renderApp(props: RenderAppProps) {
  const container = document.getElementById('app')
  if (!container) {
    logger.error('Container #app not found')
    return
  }

  if (!root) {
    root = ReactDOM.createRoot(container)
  }

  root.render(
    <React.StrictMode>
      <App {...props} />
    </React.StrictMode>
  )
}

// Main entry point
async function main() {
  logger.info('Plugin initializing...')

  // Check if this is a DB graph
  try {
    const appInfo = await logseq.App.getInfo()
    logger.debug('App info:', appInfo)
  } catch (e) {
    logger.debug('Could not get app info')
  }

  // Set up main UI container style - don't set background here, let the app handle it
  logseq.setMainUIInlineStyle({
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    zIndex: 999,
  })

  // Set callback for getting drawing data (used by block renderer)
  setGetDrawingCallback(getDrawingFromStorage)

  // Set callback for loading all drawings (used by search service)
  setLoadAllDrawingsCallback(loadAllDrawingsFromStorage)

  // Open callback - supports optional drawingId to open specific drawing
  const openExcalidraw = async (drawingId?: string) => {
    // Remember current page before opening (for insert feature)
    await rememberCurrentPage()

    if (drawingId) {
      // Open specific drawing in edit mode
      renderApp({ mode: 'edit', drawingId })
    } else {
      // Open dashboard
      renderApp({ mode: 'dashboard' })
    }
    logseq.showMainUI({ autoFocus: true })
  }

  // Register plugin commands - these open the main UI
  registerCommands(openExcalidraw)

  // Set callback for slash commands
  setOpenCallback(openExcalidraw)
  registerSlashCommands()

  registerBlockRenderers()

  // Register search service for CMD+K integration
  registerSearchService()

  // Setup handler for search result clicks
  setupSearchResultHandler()

  // Initialize search index and register drawing commands
  loadAllDrawingsFromStorage().then(drawings => {
    refreshSearchIndex(drawings)
    // Also update command palette entries for each drawing
    updateDrawingCommands()
  })

  // Fallback event listener for opening drawings from command palette
  window.addEventListener('excalidraw:open', async (e: Event) => {
    const customEvent = e as CustomEvent<{ drawingId?: string }>
    const drawingId = customEvent.detail?.drawingId
    logger.debug('Received excalidraw:open event, drawingId:', drawingId)
    await rememberCurrentPage()
    if (drawingId) {
      renderApp({ mode: 'edit', drawingId })
    } else {
      renderApp({ mode: 'dashboard' })
    }
    logseq.showMainUI({ autoFocus: true })
  })

  // Register toolbar button
  logseq.App.registerUIItem('toolbar', {
    key: 'excalidraw-open',
    template: `
      <a class="button" data-on-click="openExcalidraw" title="Open Excalidraw">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 19l7-7 3 3-7 7-3-3z"/>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
          <path d="M2 2l7.586 7.586"/>
        </svg>
      </a>
    `,
  })

  // Provide model for UI callbacks
  logseq.provideModel({
    openExcalidraw() {
      // Fix: Capture context before opening
      rememberCurrentPage().then(() => {
        renderApp({ mode: 'dashboard' })
        logseq.showMainUI({ autoFocus: true })
      })
    },
    closeExcalidraw() {
      logseq.hideMainUI()
    },
  })

  // Listen for escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      logger.debug('Escape pressed, hiding UI')
      logseq.hideMainUI({ restoreEditingCursor: true })
    }
  })

  // Listen for visibility changes
  // Listen for visibility changes
  logseq.on('ui:visible:changed', ({ visible }: { visible: boolean }) => {
    logger.debug('UI visibility changed:', visible)
  })

  // Listen for settings changes
  logseq.onSettingsChanged((newSettings: any) => {
    logger.debug('Settings changed:', newSettings)
  })

  logger.info('Plugin loaded successfully')
}

// Bootstrap
logseq.ready(main).catch(console.error)

// Export for external use
export { renderApp }
