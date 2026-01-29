import { cn } from '../../lib/utils'
import type { AppMode } from '../../types'
import { TagEditorPopover } from './TagEditorPopover'

interface EditorHeaderProps {
    drawingName: string
    mode: 'edit' | 'preview'
    onBack: () => void
    onSaveNow: () => void
    isSaving: boolean
    isJustSaved: boolean
    onCopyRef: () => void
    onInsertJournal: () => void
    onExport: () => void
    onModeChange: (mode: AppMode) => void
    currentTags: string[]
    onUpdateTags: (tags: string[]) => void
    isTagMenuOpen: boolean
    setIsTagMenuOpen: (isOpen: boolean) => void
    isDirty?: boolean
}

export function EditorHeader({
    drawingName,
    mode,
    onBack,
    onSaveNow,
    isSaving,
    isJustSaved,
    onCopyRef,
    onInsertJournal,
    onExport,
    onModeChange,
    currentTags,
    onUpdateTags,
    isTagMenuOpen,
    setIsTagMenuOpen,
    isDirty
}: EditorHeaderProps) {

    return (
        <header className="flex flex-col border-b border-black/[0.05] dark:border-white/[0.05] bg-[var(--bg-app)]/80 backdrop-blur-xl z-[60] shadow-sm">
            {/* Top row: Navigation & Info */}
            <div className="flex items-center justify-between px-4 h-11 border-b border-black/[0.03] dark:border-white/[0.03]">
                <div className="flex items-center gap-2 pl-16"> {/* Increased padding to avoid overlap */}
                    <button
                        onClick={onBack}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-all active:scale-95"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-2 px-1">
                        <h2 className="text-sm font-bold tracking-tight text-[var(--text-main)] max-w-[200px] truncate">
                            {drawingName}
                        </h2>
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-500",
                            isSaving && !isJustSaved ? "bg-amber-400 animate-pulse scale-125" :
                                isDirty ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" :
                                    "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                        )} />
                        {isDirty && !isSaving && !isJustSaved && (
                            <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold bg-orange-500/10 px-1.5 py-0.5 rounded-md">Unsaved</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 pr-2">
                    {/* Placeholder or other top-right actions */}
                </div>
            </div>

            {/* Bottom row: Controls */}
            <div className="flex items-center justify-between px-4 h-12">
                <div className="flex items-center gap-1.5">
                    {/* Tags Button & Popover */}
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsTagMenuOpen(!isTagMenuOpen)
                            }}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95",
                                isTagMenuOpen || currentTags.length > 0
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    : "bg-black/5 dark:bg-white/5 text-[var(--text-dim)] hover:bg-black/10 dark:hover:bg-white/10"
                            )}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                <line x1="7" y1="7" x2="7" y2="7" />
                            </svg>
                            {currentTags.length > 0 ? (
                                <div className="flex items-center gap-1">
                                    <span className="max-w-[120px] truncate">{currentTags.slice(0, 3).join(', ')}</span>
                                    {currentTags.length > 3 && (
                                        <span className="opacity-50 text-[10px]">+{currentTags.length - 3}</span>
                                    )}
                                </div>
                            ) : "Add Tags"}
                        </button>
                        <TagEditorPopover
                            tags={currentTags}
                            onUpdateTags={onUpdateTags}
                            isOpen={isTagMenuOpen}
                            onClose={() => setIsTagMenuOpen(false)}
                        />
                    </div>

                    <div className="w-px h-4 bg-black/5 dark:bg-white/10 mx-1" />

                    {/* Mode Switch */}
                    <div className="bg-black/5 dark:bg-white/5 p-1 rounded-full flex gap-1">
                        <button
                            onClick={() => onModeChange('edit')}
                            className={cn(
                                "px-3 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95",
                                mode === 'edit'
                                    ? "bg-white dark:bg-white/15 text-blue-600 dark:text-white shadow-sm"
                                    : "text-[var(--text-dim)] hover:text-[var(--text-main)]"
                            )}
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => onModeChange('preview')}
                            className={cn(
                                "px-3 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95",
                                mode === 'preview'
                                    ? "bg-white dark:bg-white/15 text-blue-600 dark:text-white shadow-sm"
                                    : "text-[var(--text-dim)] hover:text-[var(--text-main)]"
                            )}
                        >
                            Preview
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onSaveNow()
                        }}
                        disabled={isSaving && !isJustSaved}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95",
                            isSaving && !isJustSaved
                                ? "bg-black/5 dark:bg-white/5 text-[var(--text-dim)] cursor-not-allowed"
                                : isJustSaved
                                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                        )}
                    >
                        {isJustSaved ? (
                            <span className="flex items-center gap-1">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Saved
                            </span>
                        ) : isSaving ? "Saving..." : "Save"}
                    </button>

                    <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-full">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onCopyRef()
                            }}
                            className="p-1.5 rounded-full hover:bg-white dark:hover:bg-white/10 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-all active:scale-90"
                            title="Copy Reference"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onInsertJournal()
                            }}
                            className="p-1.5 rounded-full hover:bg-white dark:hover:bg-white/10 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-all active:scale-90"
                            title="Insert to Journal"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onExport()
                            }}
                            className="p-1.5 rounded-full hover:bg-white dark:hover:bg-white/10 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-all active:scale-90"
                            title="Export to Image"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}
