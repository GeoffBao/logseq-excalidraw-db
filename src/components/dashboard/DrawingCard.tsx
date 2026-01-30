import { useState } from 'react'
import { formatRelativeTime, cn } from '../../lib/utils'
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
    const [isCopied, setIsCopied] = useState(false)

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

    const handleCopyRef = async (e: React.MouseEvent) => {
        e.stopPropagation()
        copyDrawingReference(drawing.id, drawing.name)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    return (
        <div
            onClick={() => onOpen(drawing.id)}
            className="group relative bg-[var(--bg-app)] rounded-3xl border border-black/[0.04] dark:border-white/[0.06] overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(255,255,255,0.05)] transition-all duration-500 cursor-pointer flex flex-col h-full active:scale-[0.98]"
        >
            {/* Thumbnail */}
            <div className="aspect-[4/3] bg-white dark:bg-[#121212] p-4 flex items-center justify-center overflow-hidden border-b border-black/[0.02] dark:border-white/[0.02]">
                {drawing.thumbnail ? (
                    <img
                        src={drawing.thumbnail}
                        alt={drawing.name}
                        className="w-full h-full object-contain transform group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                    />
                ) : (
                    <div className="text-[var(--text-dim)] flex flex-col items-center gap-3 opacity-40 group-hover:opacity-60 transition-opacity">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest tracking-tighter">No Preview</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-5 flex flex-col flex-1 bg-gradient-to-b from-transparent to-black/[0.01] dark:to-white/[0.01] transition-colors group-hover:bg-black/[0.02] dark:group-hover:bg-white/[0.02]">
                {isEditingName ? (
                    <div className="mb-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-[var(--bg-app)] border border-blue-500/50 outline-none text-sm font-bold dark:text-white shadow-inner"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName()
                                if (e.key === 'Escape') setIsEditingName(false)
                            }}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveName}
                                className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setIsEditingName(false)}
                                className="px-3 py-1.5 bg-black/5 dark:bg-white/5 text-[var(--text-dim)] hover:text-[var(--text-main)] rounded-lg text-xs font-bold transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 className="font-bold text-[16px] text-[var(--text-main)] leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-1 break-words">
                                {drawing.name}
                            </h3>

                            <div
                                className="relative shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsEditingTag(!isEditingTag)
                                    setInlineTagInput('')
                                }}
                            >
                                {drawing.tags && drawing.tags.length > 0 ? (
                                    <div className="flex gap-1 flex-wrap cursor-pointer hover:scale-105 transition-transform">
                                        {drawing.tags.slice(0, 1).map((tag, i) => (
                                            <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                #{tag}
                                            </span>
                                        ))}
                                        {drawing.tags.length > 1 && (
                                            <span className="text-[10px] font-bold text-[var(--text-dim)] opacity-50">+{drawing.tags.length - 1}</span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-bold text-[var(--text-dim)] opacity-40 hover:opacity-100 dark:hover:text-blue-400 transition-all cursor-pointer flex items-center gap-1">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                        TAG
                                    </span>
                                )}

                                {/* Inline Tag Editor Popup */}
                                {isEditingTag && (
                                    <div
                                        className="absolute right-0 top-full mt-2 p-3 rounded-2xl shadow-2xl z-50 w-56 bg-[var(--bg-app)] border border-black/5 dark:border-white/10 backdrop-blur-2xl animate-in zoom-in-95 fade-in duration-200"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {(drawing.tags || []).map((tag, i) => (
                                                <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 group/tag">
                                                    #{tag}
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation()
                                                            const newTags = drawing.tags?.filter((_, idx) => idx !== i)
                                                            await onUpdate(drawing.id, { tags: newTags })
                                                        }}
                                                        className="hover:text-red-500 transition-colors opacity-50 group-hover/tag:opacity-100"
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
                                            placeholder="Type and enter..."
                                            className="w-full px-3 py-1.5 text-xs rounded-xl border bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.05] dark:border-white/[0.1] text-[var(--text-main)] outline-none focus:border-blue-500/50 transition-all font-medium"
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                            <span className="text-[12px] text-[var(--text-dim)] font-bold opacity-40 uppercase tracking-tighter">
                                {formatRelativeTime(drawing.updatedAt)}
                            </span>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsEditingName(true)
                                    }}
                                    className="p-1.5 rounded-full text-[var(--text-dim)] hover:bg-black/5 dark:hover:bg-white/10 hover:text-blue-600 transition-all active:scale-90"
                                    title="Rename"
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleCopyRef}
                                    className={cn(
                                        "px-2 py-1 flex items-center gap-1 rounded-full text-[var(--text-dim)] transition-all active:scale-90",
                                        isCopied ? "bg-emerald-500/10 text-emerald-600" : "hover:bg-black/5 dark:hover:bg-white/10 hover:text-blue-600"
                                    )}
                                    title="Copy Reference"
                                >
                                    {isCopied ? (
                                        <span className="text-[10px] font-bold animate-in fade-in slide-in-from-right-2 duration-300">COPIED!</span>
                                    ) : (
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                        </svg>
                                    )}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="p-1.5 rounded-full text-[var(--text-dim)] hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
                                    title="Delete"
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
