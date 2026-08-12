const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, 'src/pages/admin')
const compsDir = path.join(__dirname, 'src/components/admin')

const catsPage = `import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Plus, Search, RefreshCw, Edit2, Trash2 } from 'lucide-react'
import { fetchAdminMartCategories, createAdminMartCategory, deleteAdminMartCategory } from '../../api/adminBuildmartApi.js'
import { ApiError } from '../../api/http.js'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { AppPrimaryButton } from '../../components/app/AppPrimaryButton.jsx'
import { EditMartCategoryModal } from '../../components/admin/EditMartCategoryModal.jsx'

export function AdminMartCategoriesPage() {
  const reduce = useReducedMotion()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [editItem, setEditItem] = useState(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAdminMartCategories()
      setItems(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])
  
  useEffect(() => { load() }, [load])
  
  async function handleDelete(id) {
    if (!window.confirm('Delete category?')) return
    try {
      await deleteAdminMartCategory(id)
      load()
    } catch(e) {
      alert(e.message)
    }
  }

  return (
    <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div><h2 className="text-xl font-extrabold text-slate-900">Mart Categories</h2></div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary px-3 py-2"><RefreshCw className="h-4 w-4" /></button>
          <AppPrimaryButton onClick={() => setIsAddOpen(true)} className="py-2"><Plus className="h-4 w-4 mr-1" /> Add Category</AppPrimaryButton>
        </div>
      </div>
      <GlassPanel className="p-0 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-600">ID</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Label</th>
              <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">{item.id}</td>
                <td className="px-4 py-3 text-slate-600">{item.label}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setEditItem(item)} className="p-1 text-slate-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>
      
      {(editItem || isAddOpen) && (
        <EditMartCategoryModal 
          item={editItem}
          open={true}
          onClose={() => { setEditItem(null); setIsAddOpen(false); }}
          onSaved={() => { setEditItem(null); setIsAddOpen(false); load(); }}
        />
      )}
    </motion.div>
  )
}
`

const editCatModal = `import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { createAdminMartCategory, updateAdminMartCategory } from '../../api/adminBuildmartApi.js'
import { AppPrimaryButton } from '../app/AppPrimaryButton.jsx'

export function EditMartCategoryModal({ item, open, onClose, onSaved }) {
  const [id, setId] = useState('')
  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState('')
  const [tone, setTone] = useState('')
  const [active, setActive] = useState(true)
  const [busy, setBusy] = useState(false)
  
  useEffect(() => {
    if (item) {
      setId(item.id)
      setLabel(item.label)
      setIcon(item.icon || '')
      setTone(item.tone || '')
      setActive(item.active)
    }
  }, [item])
  
  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      if (item) await updateAdminMartCategory(item.id, { id, label, icon, tone, active })
      else await createAdminMartCategory({ id, label, icon, tone, active })
      onSaved()
    } catch(err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="border-b px-5 py-4 flex justify-between">
          <h3 className="font-extrabold">{item ? 'Edit' : 'Add'} Category</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">ID (slug)</label>
            <input required value={id} onChange={e => setId(e.target.value)} disabled={!!item} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Label</label>
            <input required value={label} onChange={e => setLabel(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Icon Component</label>
            <input value={icon} onChange={e => setIcon(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <AppPrimaryButton type="submit" disabled={busy} className="w-full">Save</AppPrimaryButton>
        </form>
      </motion.div>
    </div>
  )
}
`

const prodsPage = catsPage.replace(/Categories/g, 'Products').replace(/categories/g, 'products')
  .replace(/Category/g, 'Product').replace(/category/g, 'product')
const editProdModal = editCatModal.replace(/Category/g, 'Product').replace(/category/g, 'product').replace(/Icon Component/g, 'Brand').replace(/icon/g, 'brand').replace(/setIcon/g, 'setBrand').replace(/tone/g, 'categoryId').replace(/setTone/g, 'setCategoryId')

const bansPage = catsPage.replace(/Categories/g, 'Banners').replace(/categories/g, 'banners')
  .replace(/Category/g, 'Banner').replace(/category/g, 'banner')
const editBanModal = editCatModal.replace(/Category/g, 'Banner').replace(/category/g, 'banner').replace(/Icon Component/g, 'Title').replace(/icon/g, 'title').replace(/setIcon/g, 'setTitle').replace(/tone/g, 'image').replace(/setTone/g, 'setImage')


fs.writeFileSync(path.join(dir, 'AdminMartCategoriesPage.jsx'), catsPage)
fs.writeFileSync(path.join(compsDir, 'EditMartCategoryModal.jsx'), editCatModal)
fs.writeFileSync(path.join(dir, 'AdminMartProductsPage.jsx'), prodsPage)
fs.writeFileSync(path.join(compsDir, 'EditMartProductModal.jsx'), editProdModal)
fs.writeFileSync(path.join(dir, 'AdminMartBannersPage.jsx'), bansPage)
fs.writeFileSync(path.join(compsDir, 'EditMartBannerModal.jsx'), editBanModal)

console.log('Pages generated')
