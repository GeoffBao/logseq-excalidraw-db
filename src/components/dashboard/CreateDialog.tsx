

interface CreateDialogProps {
    isOpen: boolean
    onClose: () => void
    name: string
    setName: (name: string) => void
    tag: string
    setTag: (tag: string) => void
    onCreate: () => void
}

export function CreateDialog({
    isOpen,
    onClose,
    name,
    setName,
    tag,
    setTag,
    onCreate
}: CreateDialogProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-[var(--bg-app)] rounded-2xl p-6 shadow-2xl border border-black/5 dark:border-white/10 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Create New Drawing</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-dim)] mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. System Architecture"
                            className="w-full px-3 py-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] border border-transparent focus:border-blue-500/50 outline-none dark:text-white"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-dim)] mb-1">Tag (Optional)</label>
                        <input
                            type="text"
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            placeholder="e.g. Design"
                            className="w-full px-3 py-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] border border-transparent focus:border-blue-500/50 outline-none dark:text-white"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onCreate}
                            className="flex-1 py-2.5 bg-[#0071e3] text-white rounded-lg font-semibold hover:bg-[#0077ed] transition-colors"
                        >
                            Create
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-black/[0.03] dark:bg-white/[0.03] text-[var(--text-dim)] rounded-lg font-semibold hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
