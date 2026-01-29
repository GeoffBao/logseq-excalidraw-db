
import { cn } from '../../lib/utils'

interface TagFilterBarProps {
    allTags: string[]
    selectedTag: string | null
    setSelectedTag: (tag: string | null) => void
}

export function TagFilterBar({ allTags, selectedTag, setSelectedTag }: TagFilterBarProps) {
    if (allTags.length === 0) return null

    return (
        <div className="flex items-center gap-2 flex-wrap mt-4">
            <span className="text-[13px] text-[var(--text-dim)] mr-1">Filter by tags:</span>
            {selectedTag && (
                <button
                    onClick={() => setSelectedTag(null)}
                    className="px-2 py-0.5 rounded-full text-[12px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                    All ×
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
    )
}
