import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { createAdminMartBanner, updateAdminMartBanner, fetchAdminMartBannerById } from '../../api/adminBuildmartApi.js'
import { AppPrimaryButton } from '../app/AppPrimaryButton.jsx'

export function EditMartBannerModal({ item, open, onClose, onSaved }) {
  const [id, setId] = useState('')
  const [label, setLabel] = useState('')
  const [title, setTitle] = useState('')
  const [image, setImage] = useState('')
  const [active, setActive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [fetching, setFetching] = useState(false)
  
  useEffect(() => {
    if (item) {
      const bannerId = item._id || item.id;
      setFetching(true)
      fetchAdminMartBannerById(bannerId)
        .then(res => {
          const data = res?.data ?? res ?? item;
          setId(data.id || '');
          setLabel(data.label || '');
          setTitle(data.title || '');
          setImage(data.image || '');
          setActive(data.active !== false);
        })
        .catch(err => {
          console.error('Failed to load banner details', err);
          setId(item.id || '');
          setLabel(item.label || '');
          setTitle(item.title || '');
          setImage(item.image || '');
          setActive(item.active !== false);
        })
        .finally(() => setFetching(false))
    } else {
      setId('')
      setLabel('')
      setTitle('')
      setImage('')
      setActive(true)
    }
  }, [item])
  
  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      if (item) await updateAdminMartBanner(item._id || item.id, { id, label, title, image, active })
      else await createAdminMartBanner({ id, label, title, image, active })
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
          <h3 className="font-extrabold">{item ? 'Edit' : 'Add'} Banner</h3>
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
            <label className="text-xs font-bold uppercase text-slate-500">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <AppPrimaryButton type="submit" disabled={busy} className="w-full">Save</AppPrimaryButton>
        </form>
      </motion.div>
    </div>
  )
}
