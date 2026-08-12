import { useState, useEffect } from 'react'
import { Plus, Search, Tag, Edit, Trash2, X } from 'lucide-react'
import * as Icons from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassPanel } from '../../ui/GlassPanel.jsx'
import { uploadMedia, assetUrlFromUpload } from '../../../api/uploadApi.js'
import { fetchAdminMartCategories, createAdminMartCategory, deleteAdminMartCategory, updateAdminMartCategory } from '../../../api/adminBuildmartApi.js'

export function AdminMartCategoriesTab() {
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCat, setNewCat] = useState({ name: '' })
  const [newCatFile, setNewCatFile] = useState(null)
  const [newCatPreview, setNewCatPreview] = useState('')
  const [busy, setBusy] = useState(false)

  const [editCat, setEditCat] = useState(null)
  const [deleteCat, setDeleteCat] = useState(null)

  const load = async () => {
    try {
      const res = await fetchAdminMartCategories({ page, limit: 12 })
      const data = res?.data ?? res ?? {}
      setCategories(Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []))
      setTotal(data.total ?? 0)
      setPages(data.pages ?? 1)
    } catch(err) {
      console.error(err)
    }
  }

  useEffect(() => { load() }, [page])

  const filtered = categories.filter((c) =>
    (c.name || c.label || '').toLowerCase().includes(search.toLowerCase()),
  )

  const handleSave = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      let iconUrl = ''
      if (newCatFile) {
        const res = await uploadMedia(newCatFile, 'general-media')
        iconUrl = assetUrlFromUpload(res)
      }
      const slug = newCat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      await createAdminMartCategory({ id: slug, name: newCat.name, icon: iconUrl, color: '' })
      setIsModalOpen(false)
      setNewCat({ name: '' })
      setNewCatFile(null)
      setNewCatPreview('')
      load()
    } catch(err) {
      alert(err.message || 'Error creating category')
    } finally {
      setBusy(false)
    }
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      let iconUrl = editCat.icon
      if (newCatFile) {
        const res = await uploadMedia(newCatFile, 'general-media')
        iconUrl = assetUrlFromUpload(res)
      }
      await updateAdminMartCategory(editCat.id, { ...editCat, icon: iconUrl })
      setEditCat(null)
      setNewCatFile(null)
      setNewCatPreview('')
      load()
    } catch(err) {
      alert(err.message || 'Error updating category')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteAdminMartCategory(deleteCat.id)
      setDeleteCat(null)
      load()
    } catch (err) {
      alert(err.message || 'Error deleting category')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-xl border border-slate-200/60 bg-white/80 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Create Category
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((cat) => (
          <GlassPanel key={cat.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-xl bg-slate-100">
                {(() => {
                  const IconStr = cat.icon
                  if (IconStr && (IconStr.startsWith('http') || IconStr.startsWith('/') || IconStr.startsWith('data:'))) {
                    return <img src={IconStr} alt={cat.name || cat.label} className="h-full w-full object-cover" />
                  }
                  if (IconStr && Icons[IconStr]) {
                    const LucideIcon = Icons[IconStr]
                    return <div className="flex h-full items-center justify-center text-slate-500"><LucideIcon className="h-5 w-5" /></div>
                  }
                  return (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <Tag className="h-5 w-5" />
                    </div>
                  )
                })()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{cat.name || cat.label}</p>
                <p className="text-xs text-slate-500">ID: {cat.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setEditCat({ ...cat }); setNewCatPreview(cat.icon) }}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-brand"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteCat(cat)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </GlassPanel>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm text-slate-500">
            No categories found.
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold">{categories.length}</span> of <span className="font-semibold">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-slate-600">
              Page {page} of {pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 className="text-lg font-bold text-slate-800">Create Category</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-5">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Category Name
                    </label>
                    <input
                      required
                      type="text"
                      value={newCat.name}
                      onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                      placeholder="e.g. Plumbing Supplies"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Upload Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setNewCatFile(e.target.files[0])
                          setNewCatPreview(URL.createObjectURL(e.target.files[0]))
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand/10 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-brand hover:file:bg-brand/20"
                    />
                    {newCatPreview && (
                      <div className="mt-2 h-16 w-16 overflow-hidden rounded-xl border border-slate-200">
                        <img src={newCatPreview} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-brand px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                  >
                    {busy ? 'Saving...' : 'Save Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editCat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setEditCat(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h3 className="text-lg font-bold text-slate-800">Edit Category</h3>
                <button
                  type="button"
                  onClick={() => { setEditCat(null); setNewCatFile(null); setNewCatPreview('') }}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEditSave} className="p-5">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Category Name
                    </label>
                    <input
                      required
                      type="text"
                      value={editCat.name || editCat.label || ''}
                      onChange={(e) => setEditCat({ ...editCat, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Upload Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setNewCatFile(e.target.files[0])
                          setNewCatPreview(URL.createObjectURL(e.target.files[0]))
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand/10 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-brand hover:file:bg-brand/20"
                    />
                    {newCatPreview && (
                      <div className="mt-2 h-16 w-16 overflow-hidden rounded-xl border border-slate-200">
                        <img src={newCatPreview} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => { setEditCat(null); setNewCatFile(null); setNewCatPreview('') }}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-brand px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                  >
                    {busy ? 'Updating...' : 'Update Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteCat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setDeleteCat(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-5 shadow-2xl text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="mb-1 text-lg font-bold text-slate-800">Delete Category</h3>
              <p className="text-sm text-slate-500">
                Are you sure you want to delete <span className="font-semibold">{deleteCat.name}</span>? This action cannot be undone.
              </p>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteCat(null)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl bg-red-500 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
