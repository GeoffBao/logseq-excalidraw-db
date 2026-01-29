import { useState } from 'react'
import { formatRelativeTime } from '../../lib/utils'
import { copyDrawingReference } from '../../lib/plugin'
import type { Drawing } from '../../types'

interface DrawingCardProps {
    drawing: Drawing
    onOpen: (id: string) => void
    onUpdate: (id: string, updates: { name?: string; tags?: string[] }) => Promise<Drawing | null>
    onDelete: (id: string) => Promise<boolean>
    isEditingTag: boolean
    setIsEditingTag: (isEditing: boolean) => void
}

export function DrawingCard({
    drawing,
    onOpen,
    onUpdate,
    onDelete,
    isEditingTag,
    setIsEditingTag
}: DrawingCardProps) {
    const [isEditingName, setIsEditingName] = useState(false)
    const [editName, setEditName] = useState(drawing.name)
    const [inlineTagInput, setInlineTagInput] = useState('')

    const handleSaveName = async () => {
        if (!editName.trim() || editName === drawing.name) {
            setIsEditingName(false)
            return
        }
        await onUpdate(drawing.id, { name: editName.trim() })
        setIsEditingName(false)
    }

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (window.confirm(`Are you sure you want to delete "${drawing.name}"? This action cannot be undone.`)) {
            await onDelete(drawing.id)
        }
    }

    const handleCopyRef = (e: React.MouseEvent) => {
        e.stopPropagation()
        copyDrawingReference(drawing.id, drawing.name)
    }

    return (
        <div
            onClick={() => onOpen(drawing.id)}
            className="group relative bg-[var(--bg-app)] rounded-2xl border border-black/[0.03] dark:border-white/[0.03] overflow-hidden hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-white/5 transition-all duration-300 cursor-pointer flex flex-col h-full"
        >
            {/* Thumbnail */}
            <div className="aspect-[4/3] bg-white dark:bg-[#1a1a1a] p-4 flex items-center justify-center overflow-hidden">
                {drawing.thumbnail ? (
                    <img
                        src={drawing.thumbnail}
                        alt={drawing.name}
                        className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="text-[var(--text-dim)] flex flex-col items-center gap-2">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span className="text-xs font-medium">Preview Unavailable</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-5 flex flex-col flex-1 border-t border-black/[0.03] dark:border-white/[0.03] bg-gradient-to-b from-transparent to-black/[0.01] dark:to-white/[0.01]">
                {isEditingName ? (
                    <div className="mb-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-app)] border border-blue-500/50 outline-none text-sm font-medium dark:text-white"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName()
                                if (e.key === 'Escape') setIsEditingName(false)
                            }}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveName}
                                className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setIsEditingName(false)}
                                className="px-3 py-1.5 bg-[var(--bg-app)] text-[var(--text-dim)] hover:text-[var(--text-main)] rounded-lg text-xs"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="font-semibold text-[17px] text-[var(--text-main)] leading-tight group-hover:text-[var(--accent)] transition-colors flex-1 break-words">
                                {drawing.name}
                            </h3>

                            <div
                                className="relative"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsEditingTag(!isEditingTag)
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
                                    <span className="text-[11px] text-gray-400 hover:text-blue-500 cursor-pointer">+ Tag</span>
                                )}

                                {/* Inline Tag Editor Popup */}
                                {isEditingTag && (
                                    <div
                                        className="absolute right-0 top-full mt-1 p-2 rounded-lg shadow-lg z-50 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
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
                                                    const newTag = inlineTagInput.trim().replace(/^#/, '')
                                                    const currentT = drawing.tags || []
                                                    if (!currentT.includes(newTag)) {
                                                        await onUpdate(drawing.id, { tags: [...currentT, newTag] })
                                                    }
                                                    setInlineTagInput('')
                                                    setIsEditingTag(false)
                                                } else if (e.key === 'Escape') {
                                                    setIsEditingTag(false)
                                                }
                                            }}
                                            placeholder="Press Enter to add"
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
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsEditingName(true)
                                    }}
                                    className="p-1.5 rounded-lg text-[var(--text-dim)] hover:bg-[var(--bg-app)] hover:text-[#0071e3] transition-colors"
                                    title="Edit Name"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleCopyRef}
                                    className="p-1.5 rounded-lg text-[var(--text-dim)] hover:bg-[var(--bg-app)] hover:text-[#0071e3] transition-colors"
                                    title="Copy Reference"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="p-1.5 rounded-lg text-[var(--text-dim)] hover:bg-[var(--bg-app)] hover:text-red-500 transition-colors"
                                    title="Delete"
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
    )
}
