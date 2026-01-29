import React, { useState, useMemo } from 'react'
import { cn, formatRelativeTime } from '../lib/utils'

import { copyDrawingReference } from '../lib/plugin'
import type { Drawing } from '../types'

interface DashboardProps {
  drawings: Drawing[]
  onOpen: (id: string) => void
  onCreate: (name: string, tags?: string[]) => Promise<Drawing | null>
  onUpdate: (id: string, updates: { name?: string; tags?: string[] }) => Promise<Drawing | null>
  onDelete: (id: string) => Promise<boolean>
  onClose: () => void
}

export function Dashboard({ drawings, onOpen, onCreate, onUpdate, onDelete, onClose }: DashboardProps) {
  // const { theme } = useTheme() // Theme handled via CSS variables
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [newDrawingName, setNewDrawingName] = useState('')
  const [newDrawingTag, setNewDrawingTag] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editTag, setEditTag] = useState('')
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null)
  const [inlineTagInput, setInlineTagInput] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)  // Tag filter

  // Extract all unique tags from drawings
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    drawings.forEach(d => d.tags?.forEach(t => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [drawings])

  // Filter drawings by search query and selected tag
  const filteredDrawings = useMemo(() => {
    return drawings.filter((d) => {
      // Tag filter
      if (selectedTag && !d.tags?.includes(selectedTag)) return false
      // Search filter
      return !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    })
  }, [drawings, searchQuery, selectedTag])

  const handleCreate = async () => {
    if (!newDrawingName.trim()) return

    const drawing = await onCreate(newDrawingName.trim(), newDrawingTag ? [newDrawingTag] : undefined)
    if (drawing) {
      setIsCreating(false)
      setNewDrawingName('')
      setNewDrawingTag('')
    }
  }

  const handleStartEdit = (drawing: Drawing, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(drawing.id)
    setEditName(drawing.name)
    setEditTag(drawing.tags?.join(', ') || '')
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return

    await onUpdate(editingId, {
      name: editName.trim(),
      tags: editTag.trim() ? editTag.split(',').map(t => t.trim()).filter(Boolean) : undefined
    })
    setEditingId(null)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (window.confirm('确定要删除这个绘图吗？')) {
      await onDelete(id)
    }
  }

  return (
    <div className={cn(
      "h-screen flex flex-col transition-colors duration-500",
      "bg-[var(--bg-app)] text-[var(--text-main)]"
    )}>
      {/* Header - Glassmorphism Apple style */}
      <header className={cn(
        "px-8 pt-8 pb-6 sticky top-0 z-50",
        "backdrop-blur-xl bg-[var(--bg-primary-light)] dark:bg-[var(--bg-primary-dark)]",
        "border-b border-[var(--border-color)]",
        "transition-all duration-300"
      )}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-5">
              {/* Logo - Refined shadow and gradient */}
              <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-[#5E5CE6] to-[#BF5AF2] flex items-center justify-center shadow-lg shadow-[#5E5CE6]/20 ring-1 ring-black/5 dark:ring-white/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                </svg>
              </div>
              <div>
                <h1 className="text-[28px] font-bold tracking-tight leading-tight">
                  Excalidraw
                </h1>
                <p className="text-[15px] font-medium text-[var(--text-dim)]">
                  {drawings.length} 个画布
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsCreating(true)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-[15px] transition-all duration-300",
                  "bg-[#0071e3] hover:bg-[#0077ED] active:bg-[#006EDB] dark:bg-[#2997ff] dark:hover:bg-[#3ea2ff] text-white",
                  "shadow-md hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                )}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                新建
              </button>
              <button
                onClick={onClose}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                  "bg-[var(--bg-secondary-light)] dark:bg-[var(--bg-secondary-dark)]",
                  "text-[var(--text-dim)] hover:text-[var(--text-main)]",
                  "hover:bg-[rgba(0,0,0,0.08)] dark:hover:bg-[rgba(255,255,255,0.15)]",
                  "active:scale-90"
                )}
                title="关闭"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search - macOS Spotlight style */}
          <div className="relative group max-w-2xl mx-auto">
            <div className={cn(
              "absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl blur-xl transition-opacity duration-500",
              searchQuery ? "opacity-100" : "opacity-0"
            )} />
            <div className={cn(
              "relative flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300",
              "bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.1)]",
              "focus-within:bg-white dark:focus-within:bg-[rgba(40,40,40,0.8)]",
              "focus-within:shadow-xl focus-within:ring-1 focus-within:ring-black/5 dark:focus-within:ring-white/10"
            )}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-dim)]">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="搜索画布..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[17px] placeholder-[var(--text-dim)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-dim)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Tag Filter Bar */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-4">
              <span className="text-[13px] text-[var(--text-dim)] mr-1">标签筛选:</span>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="px-2 py-0.5 rounded-full text-[12px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  全部 ×
                </button>
              )}
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[12px] font-medium transition-all duration-200",
                    selectedTag === tag
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-8 pb-12 pt-4 scroll-smooth">
        <div className="max-w-7xl mx-auto w-full">
          {isCreating && (
            <div className="mb-8 animate-fadeIn">
              <div className={cn(
                "p-1 rounded-[20px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[2px]",
                "shadow-xl shadow-blue-500/20"
              )}>
                <div className="bg-[var(--bg-card)] rounded-[18px] p-6">
                  <h3 className="text-lg font-semibold mb-4">新建画布</h3>
                  <div className="flex gap-3">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Give it a name..."
                      value={newDrawingName}
                      onChange={(e) => setNewDrawingName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                      className={cn(
                        "flex-1 px-4 py-2.5 rounded-xl text-[15px] transition-all",
                        "bg-[var(--bg-app)] border border-[var(--border-color)]",
                        "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                      )}
                    />
                    <input
                      type="text"
                      placeholder="Tag (optional)"
                      value={newDrawingTag}
                      onChange={(e) => setNewDrawingTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                      className={cn(
                        "w-32 px-4 py-2.5 rounded-xl text-[15px] transition-all",
                        "bg-[var(--bg-app)] border border-[var(--border-color)]",
                        "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                      )}
                    />
                    <button
                      onClick={handleCreate}
                      disabled={!newDrawingName.trim()}
                      className={cn(
                        "px-6 py-2.5 rounded-xl font-medium text-white transition-all transform active:scale-95",
                        newDrawingName.trim()
                          ? "bg-[#0071e3] hover:bg-[#0077ED] shadow-md hover:shadow-lg hover:shadow-blue-500/25"
                          : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                      )}
                    >
                      创建
                    </button>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="px-6 py-2.5 rounded-xl font-medium text-[var(--text-dim)] hover:bg-[var(--bg-app)] transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {filteredDrawings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center animate-fadeIn opacity-0" style={{ animationFillMode: 'forwards' }}>
              <div className="w-24 h-24 mb-6 rounded-3xl bg-[var(--bg-secondary-light)] dark:bg-[var(--bg-secondary-dark)] flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-dim)] opacity-50">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
              <h3 className="text-xl font-medium mb-2 text-[var(--text-main)]">没有找到画布</h3>
              <p className="text-[var(--text-dim)] max-w-xs">
                {searchQuery ? '尝试其他搜索词' : '创建一个新的画布开始您的创意之旅'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-8 text-[var(--accent)] font-medium hover:underline text-[15px]"
                >
                  立即创建 →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDrawings.map((drawing, index) => (
                <div
                  key={drawing.id}
                  onClick={() => onOpen(drawing.id)}
                  className="group relative flex flex-col bg-[var(--bg-card)] rounded-[22px] shadow-sm border border-[var(--border-color)] hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Thumbnail Area */}
                  <div className="aspect-[4/3] w-full bg-[var(--bg-app)] relative overflow-hidden group-hover:brightness-[1.02] transition-all">
                    {drawing.thumbnail ? (
                      <img
                        src={drawing.thumbnail}
                        alt={drawing.name}
                        className="w-full h-full object-contain p-4 opacity-90 group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-dim)] opacity-20">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}

                    {/* Quick Action Overlay */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyDrawingReference(drawing.id, drawing.name)
                        }}
                        className="p-2 rounded-xl bg-white/90 dark:bg-black/80 backdrop-blur-md shadow-sm border border-black/5 hover:scale-110 active:scale-95 transition-all text-gray-700 dark:text-gray-300"
                        title="复制引用"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="p-5 flex-1 flex flex-col">
                    {editingId === drawing.id ? (
                      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          autoFocus
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-app)] border border-blue-500 outline-none text-[15px] font-medium"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 bg-[var(--bg-app)] text-[var(--text-dim)] hover:text-[var(--text-main)] rounded-lg text-xs"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-[17px] text-[var(--text-main)] truncate leading-tight group-hover:text-[var(--accent)] transition-colors">
                            {drawing.name}
                          </h3>
                          {/* Clickable tags area for inline editing */}
                          <div
                            className="relative"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingTagsId(editingTagsId === drawing.id ? null : drawing.id)
                              setInlineTagInput('')
                            }}
                          >
                            {drawing.tags && drawing.tags.length > 0 ? (
                              <div className="flex gap-1 flex-wrap cursor-pointer hover:opacity-80">
                                {drawing.tags.slice(0, 2).map((tag, i) => (
                                  <span key={i} className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    #{tag}
                                  </span>
                                ))}
                                {drawing.tags.length > 2 && (
                                  <span className="text-[11px] text-gray-400">+{drawing.tags.length - 2}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-400 hover:text-blue-500 cursor-pointer">+ 标签</span>
                            )}

                            {/* Inline Tag Editor Popup */}
                            {editingTagsId === drawing.id && (
                              <div
                                className="absolute left-0 top-full mt-1 p-2 rounded-lg shadow-lg z-50 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {(drawing.tags || []).map((tag, i) => (
                                    <span key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                                      #{tag}
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation()
                                          const newTags = drawing.tags?.filter((_, idx) => idx !== i)
                                          await onUpdate(drawing.id, { tags: newTags })
                                        }}
                                        className="hover:text-red-500"
                                      >×</button>
                                    </span>
                                  ))}
                                </div>
                                <input
                                  type="text"
                                  value={inlineTagInput}
                                  onChange={(e) => setInlineTagInput(e.target.value)}
                                  onKeyDown={async (e) => {
                                    if (e.key === 'Enter' && inlineTagInput.trim()) {
                                      e.stopPropagation()
                                      const newTag = inlineTagInput.trim().replace(/^#/, '')
                                      const currentT = drawing.tags || []
                                      if (!currentT.includes(newTag)) {
                                        await onUpdate(drawing.id, { tags: [...currentT, newTag] })
                                      }
                                      setInlineTagInput('')
                                      setEditingTagsId(null)
                                    } else if (e.key === 'Escape') {
                                      setEditingTagsId(null)
                                    }
                                  }}
                                  placeholder="回车添加标签"
                                  className="w-full px-2 py-1 text-[11px] rounded border bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                                  autoFocus
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-[13px] text-[var(--text-dim)] font-medium">
                            {formatRelativeTime(drawing.updatedAt)}
                          </span>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                            <button
                              onClick={(e) => handleStartEdit(drawing, e)}
                              className="p-1.5 rounded-lg text-[var(--text-dim)] hover:bg-[var(--bg-app)] hover:text-[#0071e3] transition-colors"
                              title="编辑"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, drawing.id)}
                              className="p-1.5 rounded-lg text-[var(--text-dim)] hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                              title="删除"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
