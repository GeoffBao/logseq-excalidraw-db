import { useCallback, useMemo, useState } from 'react'
import { Excalidraw, WelcomeScreen } from '@excalidraw/excalidraw'
// import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types'
import { useExcalidraw } from '../hooks/useExcalidraw'
import { cn } from '../lib/utils'
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
  })

  // Handle save with feedback
  const handleSave = useCallback(async () => {
    console.log('[Excalidraw] Manual save triggered')
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
    console.log('[Excalidraw] Closing editor')
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
      {/* Header - above Excalidraw canvas but below popups */}
      {/* pl-20 leaves space for macOS window controls */}
      <header
        className={cn(
          "flex items-center justify-between pl-20 pr-4 py-2 border-b",
          theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        )}
        style={{ position: 'relative', zIndex: 100 }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              console.log('[Excalidraw] Back button clicked')
              onBack()
            }}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm relative",
              theme === 'dark'
                ? 'hover:bg-gray-800 text-gray-300'
                : 'hover:bg-gray-100 text-gray-600'
            )}
            title="返回列表"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>返回</span>
          </button>
          <span className={cn(
            "text-sm font-medium",
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {drawing.name}
          </span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded",
            isSaving
              ? 'bg-yellow-500/20 text-yellow-500'
              : isDirty
                ? 'bg-orange-500/20 text-orange-500'
                : 'bg-green-500/20 text-green-500'
          )}>
            {isSaving ? '保存中...' : isDirty ? '未保存' : '已保存'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <div className={cn(
            "flex rounded-lg p-1",
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
          )}>
            <button
              onClick={() => onModeChange('edit')}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                mode === 'edit'
                  ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 shadow'
                  : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              编辑
            </button>
            <button
              onClick={() => onModeChange('preview')}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors",
                mode === 'preview'
                  ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 shadow'
                  : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              预览
            </button>
          </div>

          {/* Save Button - always clickable */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
              'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
            )}
          >
            {isSaving ? '保存中...' : '保存'}
          </button>

          {/* Insert/Share Menu */}
          <div className="relative">
            <button
              onClick={() => setShowInsertMenu(!showInsertMenu)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                theme === 'dark'
                  ? 'hover:bg-purple-900/50 text-purple-400'
                  : 'hover:bg-purple-100 text-purple-600'
              )}
              title="插入/分享"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
            {showInsertMenu && (
              <div className={cn(
                "absolute right-0 mt-2 w-56 py-1 rounded-lg shadow-lg z-[1002]",
                theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              )}>
                {/* Copy Reference */}
                <button
                  onClick={async () => {
                    await copyDrawingReference(drawing.id, drawing.name)
                    setShowInsertMenu(false)
                  }}
                  className={cn(
                    "w-full px-4 py-2.5 text-sm text-left transition-colors flex items-center gap-3",
                    theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  )}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <div>
                    <div>复制引用</div>
                    <div className={cn("text-xs", theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                      粘贴到任意位置
                    </div>
                  </div>
                </button>

                {/* Insert to Last Page */}
                {(() => {
                  const lastPage = getLastVisitedPage()
                  return (
                    <>
                      <button
                        onClick={async () => {
                          await import('../lib/plugin').then(m => m.insertDrawingToToday(drawing.id, drawing.name))
                          setShowInsertMenu(false)
                        }}
                        className={cn(
                          "w-full px-4 py-2.5 text-sm text-left transition-colors flex items-center gap-3",
                          theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                        )}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                          <path d="M12 15l2 2 4-4" />
                        </svg>
                        <div>
                          <div>插入到今日日记</div>
                          <div className={cn("text-xs", theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                            快速记录到 Journal
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={async () => {
                          await insertDrawingToLastPage(drawing.id, drawing.name)
                          setShowInsertMenu(false)
                        }}
                        disabled={!lastPage}
                        className={cn(
                          "w-full px-4 py-2.5 text-sm text-left transition-colors flex items-center gap-3",
                          !lastPage && 'opacity-50 cursor-not-allowed',
                          theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                        )}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="12" y1="18" x2="12" y2="12" />
                          <line x1="9" y1="15" x2="15" y2="15" />
                        </svg>
                        <div>
                          <div>插入到页面</div>
                          <div className={cn("text-xs truncate max-w-[160px]", theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                            {lastPage ? lastPage.name : '无可用页面'}
                          </div>
                        </div>
                      </button>
                    </>
                  )
                })()}
              </div>
            )}
          </div>

          {/* Save Message Toast */}
          {saveMessage && (
            <span className={cn(
              "absolute top-full mt-2 right-20 px-3 py-1 rounded text-sm",
              saveMessage.includes('成功') ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            )}>
              {saveMessage}
            </span>
          )}

          {/* Export Menu - click based */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                theme === 'dark'
                  ? 'hover:bg-gray-800 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              )}
              title="导出"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            {showExportMenu && (
              <div className={cn(
                "absolute right-0 mt-2 w-32 py-1 rounded-lg shadow-lg z-50",
                theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              )}>
                <button
                  onClick={() => { handleExport('svg'); setShowExportMenu(false); }}
                  className={cn(
                    "w-full px-4 py-2 text-sm text-left transition-colors",
                    theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  )}
                >
                  导出 SVG
                </button>
                <button
                  onClick={() => { handleExport('png'); setShowExportMenu(false); }}
                  className={cn(
                    "w-full px-4 py-2 text-sm text-left transition-colors",
                    theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  )}
                >
                  导出 PNG
                </button>
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className={cn(
              "p-2 rounded-lg transition-colors",
              theme === 'dark'
                ? 'hover:bg-red-900/50 text-gray-300 hover:text-red-400'
                : 'hover:bg-red-100 text-gray-600 hover:text-red-600'
            )}
            title="关闭 (Esc)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Excalidraw Canvas */}
      <div className="flex-1 relative">
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
