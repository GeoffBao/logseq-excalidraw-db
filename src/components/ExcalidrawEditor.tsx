import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { Excalidraw, WelcomeScreen } from '@excalidraw/excalidraw'

import { useExcalidraw } from '../hooks/useExcalidraw'
import { cn } from '../lib/utils'
import { logger } from '../lib/logger'
import { copyDrawingReference, insertDrawingToLastPage, getLastVisitedPage } from '../lib/plugin'
import type { Drawing, Theme, AppMode } from '../types'

// Note: Chinese fonts are pre-loaded in main.tsx before this component loads

interface ExcalidrawEditorProps {
  drawing: Drawing
  mode: 'edit' | 'preview'
  theme: Theme
  onSave: (drawing: Drawing) => Promise<Drawing | null>
  onBack: () => void
  onModeChange: (mode: AppMode) => void
  onClose: () => void
}

export function ExcalidrawEditor({
  drawing,
  mode,
  theme,
  onSave,
  onBack,
  onModeChange,
  onClose,
}: ExcalidrawEditorProps) {
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showInsertMenu, setShowInsertMenu] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [showTagEditor, setShowTagEditor] = useState(false)
  const [currentTags, setCurrentTags] = useState<string[]>(drawing.tags || [])
  const [tagInput, setTagInput] = useState('')

  // Close all popup menus
  const closeAllMenus = useCallback(() => {
    setShowTagEditor(false)
    setShowInsertMenu(false)
    setShowExportMenu(false)
  }, [])

  // Ref for passing tags to hook for saving
  const tagsRef = useRef<string[]>(currentTags)
  useEffect(() => {
    tagsRef.current = currentTags
  }, [currentTags])

  const {
    isDirty,
    isSaving,
    setExcalidrawAPI,
    handleChange,
    saveNow,
    exportToSVG,
    exportToPNG,
  } = useExcalidraw({
    drawing,
    onSave,
    autoSaveInterval: 5000,
    tagsRef,
  })

  // Handle save with feedback
  const handleSave = useCallback(async () => {
    logger.debug('[Excalidraw] Manual save triggered')
    const success = await saveNow()
    if (success) {
      setSaveMessage('保存成功!')
      setTimeout(() => setSaveMessage(null), 2000)
    } else {
      setSaveMessage('保存失败')
      setTimeout(() => setSaveMessage(null), 2000)
    }
  }, [saveNow])

  // Handle close
  const handleClose = useCallback(() => {
    logger.debug('[Excalidraw] Closing editor')
    onClose()
  }, [onClose])

  // Removed unused handleAPIReady

  const handleExport = useCallback(async (format: 'svg' | 'png') => {
    if (format === 'svg') {
      const svg = await exportToSVG()
      if (svg) {
        const blob = new Blob([svg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${drawing.name}.svg`
        a.click()
        URL.revokeObjectURL(url)
      }
    } else {
      const blob = await exportToPNG()
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${drawing.name}.png`
        a.click()
        URL.revokeObjectURL(url)
      }
    }
  }, [drawing.name, exportToSVG, exportToPNG])

  const initialData = useMemo(() => ({
    elements: drawing.data.elements,
    appState: {
      ...drawing.data.appState,
      theme,
    },
    files: drawing.data.files || undefined,
  }), [drawing.data, theme])

  return (
    <div className="excalidraw-editor-container h-screen flex flex-col">
      {/* Two-Row Header - keeps all buttons in left safe zone */}
      <header
        className={cn(
          "flex flex-col border-b",
          theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        )}
        style={{ position: 'relative', zIndex: 100 }}
      >
        {/* Row 1: Back + Title */}
        <div className="flex items-center gap-2 px-4 pt-2 pb-1" style={{ marginLeft: '70px' }}>
          <button
            onClick={() => {
              logger.debug('[Excalidraw] Back button clicked')
              onBack()
            }}
            className={cn(
              "p-1 rounded transition-colors",
              theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            )}
            title="返回列表"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className={cn(
            "text-sm font-medium truncate",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )} style={{ maxWidth: '180px' }}>
            {drawing.name}
          </span>
          {/* Status dot */}
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            isSaving ? 'bg-yellow-500 animate-pulse' : isDirty ? 'bg-orange-500' : 'bg-green-500'
          )} title={isSaving ? '保存中' : isDirty ? '未保存' : '已保存'} />
        </div>

        {/* Row 2: All action buttons - compact strip */}
        <div className="flex items-center gap-1 px-4 pb-2" style={{ marginLeft: '70px' }}>
          {/* Tags */}
          <div className="relative">
            <button
              onClick={() => setShowTagEditor(!showTagEditor)}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors",
                theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              )}
            >
              {currentTags.length > 0 ? (
                currentTags.slice(0, 2).map((tag, i) => (
                  <span key={i} className={cn(
                    "px-1.5 py-0.5 rounded-full",
                    theme === 'dark' ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                  )}>#{tag}</span>
                ))
              ) : (
                <span>+ 标签</span>
              )}
              {currentTags.length > 2 && <span className="text-gray-400">+{currentTags.length - 2}</span>}
            </button>
            {showTagEditor && (
              <div className={cn(
                "absolute left-0 top-full mt-1 p-2 rounded-lg shadow-lg z-50 w-56",
                theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              )}>
                <div className="flex flex-wrap gap-1 mb-2">
                  {currentTags.map((tag, i) => (
                    <span key={i} className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px]",
                      theme === 'dark' ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                    )}>
                      #{tag}
                      <button onClick={() => setCurrentTags(currentTags.filter((_, idx) => idx !== i))} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      const newTag = tagInput.trim().replace(/^#/, '')
                      if (!currentTags.includes(newTag)) setCurrentTags([...currentTags, newTag])
                      setTagInput('')
                      setShowTagEditor(false)  // Auto close after adding
                    } else if (e.key === 'Escape') {
                      setShowTagEditor(false)
                    }
                  }}
                  placeholder="回车添加标签"
                  className={cn(
                    "w-full px-2 py-1 text-[11px] rounded border",
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'
                  )}
                />
              </div>
            )}
          </div>

          <span className={cn("mx-1 text-[10px]", theme === 'dark' ? 'text-gray-600' : 'text-gray-300')}>|</span>

          {/* Mode Toggle */}
          <div className={cn("flex rounded text-[11px]", theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100')}>
            <button
              onClick={() => onModeChange('edit')}
              className={cn("px-2 py-0.5 rounded-l transition-colors",
                mode === 'edit'
                  ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}
            >编辑</button>
            <button
              onClick={() => onModeChange('preview')}
              className={cn("px-2 py-0.5 rounded-r transition-colors",
                mode === 'preview'
                  ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}
            >预览</button>
          </div>

          <span className={cn("mx-1 text-[10px]", theme === 'dark' ? 'text-gray-600' : 'text-gray-300')}>|</span>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >保存</button>

          {/* Insert */}
          <div className="relative">
            <button
              onClick={() => setShowInsertMenu(!showInsertMenu)}
              className={cn("p-1 rounded transition-colors", theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}
              title="插入"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
            {showInsertMenu && (
              <div className={cn(
                "absolute left-0 top-full mt-1 w-48 py-1 rounded-lg shadow-lg z-50",
                theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              )}>
                <button
                  onClick={async () => { await copyDrawingReference(drawing.id, drawing.name); setShowInsertMenu(false); }}
                  className={cn("w-full px-3 py-1.5 text-[11px] text-left flex items-center gap-2", theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  复制引用
                </button>
                <button
                  onClick={async () => { await import('../lib/plugin').then(m => m.insertDrawingToToday(drawing.id, drawing.name)); setShowInsertMenu(false); }}
                  className={cn("w-full px-3 py-1.5 text-[11px] text-left flex items-center gap-2", theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  插入到今日日记
                </button>
                {(() => {
                  const lastPage = getLastVisitedPage()
                  return lastPage ? (
                    <button
                      onClick={async () => { await insertDrawingToLastPage(drawing.id, drawing.name); setShowInsertMenu(false); }}
                      className={cn("w-full px-3 py-1.5 text-[11px] text-left flex items-center gap-2", theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      <span className="truncate">插入到 {lastPage.name}</span>
                    </button>
                  ) : null
                })()}
              </div>
            )}
          </div>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className={cn("p-1 rounded transition-colors", theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}
              title="导出"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            {showExportMenu && (
              <div className={cn("absolute left-0 top-full mt-1 w-24 py-1 rounded-lg shadow-lg z-50", theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200')}>
                <button onClick={() => { handleExport('svg'); setShowExportMenu(false); }} className={cn("w-full px-3 py-1 text-[11px] text-left", theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}>SVG</button>
                <button onClick={() => { handleExport('png'); setShowExportMenu(false); }} className={cn("w-full px-3 py-1 text-[11px] text-left", theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}>PNG</button>
              </div>
            )}
          </div>

          {/* Close */}
          <button
            onClick={handleClose}
            className={cn("p-1 rounded transition-colors", theme === 'dark' ? 'hover:bg-red-900/50 text-gray-400 hover:text-red-400' : 'hover:bg-red-100 text-gray-500 hover:text-red-600')}
            title="关闭"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Save Message Toast */}
        {saveMessage && (
          <span className={cn(
            "absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded text-xs",
            saveMessage.includes('成功') ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          )}>
            {saveMessage}
          </span>
        )}
      </header>

      {/* Excalidraw Canvas */}
      <div className="flex-1 relative" onClick={closeAllMenus}>
        {/* Key forces re-mount when drawing changes */}
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={initialData}
          onChange={handleChange}
          theme={theme}
          langCode="zh-CN"
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: true,
              clearCanvas: true,
              export: { saveFileToDisk: true },
              loadScene: true,
              saveToActiveFile: false,
              toggleTheme: false, // We handle theme externally
              saveAsImage: true,
            },
            welcomeScreen: true,
            tools: {
              image: true
            }
          }}
        >
          <WelcomeScreen>
            <WelcomeScreen.Center>
              <WelcomeScreen.Center.Logo>
                <div className="flex items-center gap-2 text-xl font-bold">
                  <span>✏️</span>
                  <span>Excalidraw for Logseq</span>
                </div>
              </WelcomeScreen.Center.Logo>
              <WelcomeScreen.Center.Heading>
                开始绘制你的想法
              </WelcomeScreen.Center.Heading>
            </WelcomeScreen.Center>
          </WelcomeScreen>
        </Excalidraw>
      </div>
    </div>
  )
}
