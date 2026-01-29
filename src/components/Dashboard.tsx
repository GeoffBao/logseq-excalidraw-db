import { useState, useMemo } from 'react'
import type { DashboardProps } from '../types'
import { SearchHeader } from './dashboard/SearchHeader'
import { TagFilterBar } from './dashboard/TagFilterBar'
import { DrawingCard } from './dashboard/DrawingCard'
import { CreateDialog } from './dashboard/CreateDialog'

export function Dashboard({ drawings, onOpen, onCreate, onUpdate, onDelete, onClose }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTag, setNewTag] = useState('')

  const [editingTagsId, setEditingTagsId] = useState<string | null>(null)

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
    if (!newName.trim()) return
    const tags = newTag.trim() ? [newTag.trim().replace(/^#/, '')] : []
    const success = await onCreate(newName.trim(), tags)
    if (success) {
      setIsCreateOpen(false)
      setNewName('')
      setNewTag('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#f5f5f7] dark:bg-[#000000] flex flex-col font-sans overflow-hidden">
      <SearchHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onNew={() => setIsCreateOpen(true)}
        totalCount={drawings.length}
      />

      <main
        className="flex-1 overflow-y-auto px-8 py-8"
        onClick={() => setEditingTagsId(null)} // Close inline tag editors when clicking background
      >
        <div className="max-w-6xl mx-auto">
          <TagFilterBar
            allTags={allTags}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
          />

          {filteredDrawings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8 pb-12">
              {filteredDrawings.map((drawing) => (
                <DrawingCard
                  key={drawing.id}
                  drawing={drawing}
                  onOpen={onOpen}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  isEditingTag={editingTagsId === drawing.id}
                  setIsEditingTag={(isEditing) => setEditingTagsId(isEditing ? drawing.id : null)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-24 h-24 rounded-3xl bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-center mb-6">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-dim)]">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-main)] mb-2">No Drawings Found</h3>
              <p className="text-[var(--text-dim)] max-w-xs mx-auto mb-8 font-medium">
                {searchQuery || selectedTag ? 'Try another search term or clear filters.' : 'Start creating your first amazing drawing!'}
              </p>
              {!searchQuery && !selectedTag && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-8 py-3 bg-[#0071e3] text-white rounded-full font-bold hover:bg-[#0077ed] transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  Create New Drawing
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <CreateDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        name={newName}
        setName={setNewName}
        tag={newTag}
        setTag={setNewTag}
        onCreate={handleCreate}
      />

      {/* Floating Close Button for Dashboard */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onClose()
        }}
        className="fixed top-6 right-6 z-50 p-2.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--text-main)] transition-all backdrop-blur-md active:scale-90 shadow-sm"
        title="Close"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
