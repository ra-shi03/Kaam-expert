import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react'
import { AppPrimaryButton } from '../../components/app/AppPrimaryButton.jsx'
import { fetchAdminBanners, createAdminBanner, deleteAdminBanner } from '../../api/adminBannersApi.js'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'

export function AdminBannersPage() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const loadBanners = async () => {
    try {
      setLoading(true)
      const res = await fetchAdminBanners('APP')
      setBanners(res.data?.banners ?? [])
      setError('')
    } catch (e) {
      setError(e.message || 'Failed to load banners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBanners()
  }, [])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      setError('')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('panel', 'APP')
      
      await createAdminBanner(formData)
      await loadBanners()
    } catch (err) {
      setError(err.message || 'Failed to upload banner')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return
    try {
      setError('')
      await deleteAdminBanner(id)
      await loadBanners()
    } catch (err) {
      setError(err.message || 'Failed to delete banner')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Banners</h1>
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <AppPrimaryButton onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Upload Banner
        </AppPrimaryButton>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-12 text-slate-500">
          <ImageIcon className="mb-2 h-10 w-10 opacity-20" />
          <p>No banners uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map(banner => (
            <GlassPanel key={banner._id} className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="aspect-[21/9] w-full bg-slate-100">
                <img 
                  src={banner.imageUrl} 
                  alt="Banner" 
                  className="h-full w-full object-cover" 
                />
              </div>
              <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => handleDelete(banner._id)}
                  className="rounded-full bg-white/90 p-2 text-red-600 shadow-sm transition-colors hover:bg-red-50 hover:text-red-700"
                  title="Delete banner"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  )
}
