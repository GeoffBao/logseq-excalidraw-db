import { useState } from 'react'


interface TagEditorPopoverProps {
    tags: string[]
    onUpdateTags: (tags: string[]) => void
    isOpen: boolean
    onClose: () => void
}

export function TagEditorPopover({ tags, onUpdateTags, isOpen, onClose }: TagEditorPopoverProps) {
    const [tagInput, setTagInput] = useState('')

    if (!isOpen) return null

    const handleAddTag = () => {
        const newTag = tagInput.trim().replace(/^#/, '')
        if (newTag && !tags.includes(newTag)) {
            onUpdateTags([...tags, newTag])
        }
        setTagInput('')
    }

    const handleRemoveTag = (tagToRemove: string) => {
        onUpdateTags(tags.filter(t => t !== tagToRemove))
    }

    return (
        <div
            className="absolute top-full left-0 mt-3 p-4 rounded-2xl shadow-2xl z-[100] w-72 bg-[var(--bg-app)]/95 backdrop-blur-xl border border-black/5 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
        >
            <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                {tags.length > 0 ? (
                    tags.map((tag, i) => (
                        <span
                            key={i}
                            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        >
                            #{tag}
                            <button
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-red-500 transition-colors opacity-60 group-hover:opacity-100"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </span>
                    ))
                ) : (
                    <p className="text-[13px] text-[var(--text-dim)] py-2 text-center w-full">No tags added</p>
                )}
            </div>
            <div className="relative">
                <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddTag()
                        } else if (e.key === 'Escape') {
                            onClose()
                        }
                    }}
                    placeholder="Enter tag and press Enter..."
                    className="w-full px-4 py-2.5 text-[13px] rounded-xl border border-black/5 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] focus:border-blue-500/50 outline-none transition-all"
                    autoFocus
                />
                <div className="flex justify-between mt-3 px-1">
                    <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider font-bold">Press Enter to add</span>
                    <button
                        onClick={onClose}
                        className="text-[11px] font-bold text-blue-500 hover:text-blue-600"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    )
}
