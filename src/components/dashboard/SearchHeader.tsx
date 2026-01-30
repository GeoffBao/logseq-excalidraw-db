

interface SearchHeaderProps {
    searchQuery: string
    setSearchQuery: (query: string) => void
    onNew: () => void
    totalCount: number
}

export function SearchHeader({ searchQuery, setSearchQuery, onNew, totalCount }: SearchHeaderProps) {
    return (
        <header className="sticky top-0 z-40 bg-[var(--bg-app)]/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.06] px-8 py-6">
            <div className="max-w-6xl mx-auto flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30 animate-in zoom-in-90 duration-500">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                                <path d="M2 2l7.5 1.5" />
                                <path d="M14 14l5 5" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-main)] leading-none mb-1">Excalidraw</h1>
                            <p className="text-[var(--text-dim)] font-bold text-sm uppercase tracking-wider opacity-60">
                                {totalCount} {totalCount === 1 ? 'drawing' : 'drawings'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onNew}
                            className="px-7 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full font-bold transition-all duration-300 shadow-xl shadow-blue-500/20 flex items-center gap-2 active:scale-95 group"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-300">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            New Drawing
                        </button>
                    </div>
                </div>

                <div className="relative group/search max-w-2xl">
                    <div className="absolute inset-0 bg-black/[0.03] dark:bg-white/[0.03] rounded-2xl transition-all duration-500 group-focus-within/search:bg-black/[0.01] dark:group-focus-within/search:bg-white/[0.01] group-focus-within/search:scale-[1.01]" />
                    <div className="relative flex items-center gap-4 px-6 py-4 rounded-2xl border border-transparent transition-all duration-500 group-focus-within/search:border-blue-500/20 group-focus-within/search:shadow-[0_20px_40px_rgba(0,0,0,0.06)] dark:group-focus-within/search:shadow-[0_20px_40px_rgba(255,255,255,0.02)] group-focus-within/search:bg-[var(--bg-app)]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--text-dim)] group-focus-within/search:text-blue-500 transition-colors">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name or tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-[17px] font-medium placeholder-[var(--text-dim)]/50 text-[var(--text-main)]"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-dim)] transition-all active:scale-90"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
