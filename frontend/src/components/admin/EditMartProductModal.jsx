import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { createAdminMartProduct, updateAdminMartProduct } from '../../api/adminBuildmartApi.js'
import { AppPrimaryButton } from '../app/AppPrimaryButton.jsx'

export function EditMartProductModal({ item, open, onClose, onSaved }) {
  const [id, setId] = useState('')
  const [label, setLabel] = useState('')
  const [brand, setBrand] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [active, setActive] = useState(true)
  const [busy, setBusy] = useState(false)
  
  useEffect(() => {
    if (item) {
      setId(item.id)
      setLabel(item.label)
      setBrand(item.brand || '')
      setCategoryId(item.categoryId || '')
      setActive(item.active)
    }
  }, [item])
  
  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      if (item) await updateAdminMartProduct(item.id, { id, label, brand, categoryId, active })
      else await createAdminMartProduct({ id, label, brand, categoryId, active })
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
          <h3 className="font-extrabold">{item ? 'Edit' : 'Add'} Product</h3>
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
            <label className="text-xs font-bold uppercase text-slate-500">Brand</label>
            <input value={brand} onChange={e => setBrand(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <AppPrimaryButton type="submit" disabled={busy} className="w-full">Save</AppPrimaryButton>
        </form>
      </motion.div>
    </div>
  )
}
