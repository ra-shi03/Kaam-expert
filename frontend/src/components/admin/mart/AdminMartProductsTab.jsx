import { useState, useEffect } from 'react'
import { Plus, Search, Package, Edit, Trash2, X, PlusCircle, MinusCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchAdminMartProducts, createAdminMartProduct, updateAdminMartProduct, deleteAdminMartProduct, fetchAdminMartCategories } from '../../../api/adminBuildmartApi.js'
import { uploadMedia, assetUrlFromUpload } from '../../../api/uploadApi.js'

export function AdminMartProductsTab() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  
  const emptySupplier = { name: '', rating: '', city: '' }
  const defaultProd = {
    id: '', name: '', brand: '', categoryId: '', 
    priceLabel: '', availability: 'in_stock', 
    shortDescription: '', description: '', deliveryInfo: '',
    supplier: { ...emptySupplier },
    specs: [], 
    variants: [], 
    relatedIds: ''
  }

  const [newProd, setNewProd] = useState(defaultProd)
  const [newProdFile, setNewProdFile] = useState(null)
  const [newProdPreview, setNewProdPreview] = useState('')
  
  const [editProd, setEditProd] = useState(null)
  const [deleteProd, setDeleteProd] = useState(null)

  const load = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetchAdminMartProducts({ page, limit: 12 }),
        fetchAdminMartCategories({ page: 1, limit: 500 }) // Load all categories for the dropdown
      ])
      const pData = prodRes?.data ?? prodRes ?? {}
      const cData = catRes?.data?.items ?? catRes?.data ?? catRes ?? []
      
      setProducts(Array.isArray(pData.items) ? pData.items : (Array.isArray(pData) ? pData : []))
      setTotal(pData.total ?? 0)
      setPages(pData.pages ?? 1)
      setCategories(Array.isArray(cData) ? cData : [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { load() }, [page])

  const getCategoryName = (id) => {
    const c = categories.find(c => c.id === id)
    return c ? (c.name || c.label) : (id || 'Unknown')
  }

  const getStockLabel = (avail) => {
    if (avail === 'in_stock') return 'In Stock'
    if (avail === 'limited') return 'Low Stock'
    if (avail === 'preorder') return 'Out of Stock'
    return 'In Stock'
  }

  const filtered = products.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      getCategoryName(p.categoryId).toLowerCase().includes(search.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(search.toLowerCase()),
  )

  const preparePayload = (prodData, iconUrl) => {
    const slug = prodData.id || prodData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const related = (typeof prodData.relatedIds === 'string' ? prodData.relatedIds.split(',').map(s => s.trim()).filter(Boolean) : prodData.relatedIds) || []
    
    return {
      id: slug,
      name: prodData.name,
      brand: prodData.brand || 'Generic',
      categoryId: prodData.categoryId || (categories[0]?.id || 'misc'),
      priceLabel: prodData.priceLabel,
      availability: prodData.availability,
      shortDescription: prodData.shortDescription,
      description: prodData.description,
      deliveryInfo: prodData.deliveryInfo,
      supplier: {
        name: prodData.supplier?.name || '',
        rating: Number(prodData.supplier?.rating) || 0,
        city: prodData.supplier?.city || ''
      },
      specs: prodData.specs || [],
      variants: prodData.variants || [],
      variantCount: (prodData.variants || []).length,
      relatedIds: related,
      images: iconUrl ? [iconUrl] : []
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      let iconUrl = ''
      if (newProdFile) {
        const res = await uploadMedia(newProdFile, 'general-media')
        iconUrl = assetUrlFromUpload(res)
      }
      
      const payload = preparePayload(newProd, iconUrl)
      
      await createAdminMartProduct(payload)
      setIsModalOpen(false)
      setNewProd(defaultProd)
      setNewProdFile(null)
      setNewProdPreview('')
      load()
    } catch (err) {
      alert(err.message || 'Error creating product')
    } finally {
      setBusy(false)
    }
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      let iconUrl = editProd.images?.[0] || ''
      if (newProdFile) {
        const res = await uploadMedia(newProdFile, 'general-media')
        iconUrl = assetUrlFromUpload(res)
      }
      
      const payload = preparePayload(editProd, iconUrl)
      // Keep existing images if no new one uploaded
      if (!newProdFile && editProd.images) {
        payload.images = editProd.images
      }
      
      const backendId = editProd._id || editProd.id
      await updateAdminMartProduct(backendId, payload)
      
      setEditProd(null)
      setNewProdFile(null)
      setNewProdPreview('')
      load()
    } catch (err) {
      alert(err.message || 'Error updating product')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    try {
      const backendId = deleteProd._id || deleteProd.id
      await deleteAdminMartProduct(backendId)
      setDeleteProd(null)
      load()
    } catch (err) {
      alert(err.message || 'Error deleting product')
    }
  }

  const renderProductForm = (prod, setProd, isEdit) => (
    <div className="space-y-6">
      {/* Basic Details */}
      <div>
        <h4 className="mb-3 font-bold text-slate-800 border-b pb-2">Basic Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">ID (Slug)</label>
            <input
              disabled={isEdit}
              type="text"
              value={prod.id}
              onChange={(e) => setProd({ ...prod, id: e.target.value })}
              placeholder="Leave empty to auto-generate"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Product Name *</label>
            <input
              required
              type="text"
              value={prod.name}
              onChange={(e) => setProd({ ...prod, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Brand Name *</label>
            <input
              required
              type="text"
              value={prod.brand}
              onChange={(e) => setProd({ ...prod, brand: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Category *</label>
            <select
              required
              value={prod.categoryId}
              onChange={(e) => setProd({ ...prod, categoryId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name || c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Price Label *</label>
            <input
              required
              type="text"
              value={prod.priceLabel}
              onChange={(e) => setProd({ ...prod, priceLabel: e.target.value })}
              placeholder="e.g. ₹400/bag"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Stock Status *</label>
            <select
              value={prod.availability}
              onChange={(e) => setProd({ ...prod, availability: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              <option value="in_stock">In Stock</option>
              <option value="limited">Low Stock</option>
              <option value="preorder">Out of Stock</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="mb-1 block text-xs font-semibold text-slate-700">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setNewProdFile(e.target.files[0])
                setNewProdPreview(URL.createObjectURL(e.target.files[0]))
              }
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-brand/10 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-brand hover:file:bg-brand/20"
          />
          {newProdPreview && (
            <div className="mt-2 h-16 w-16 overflow-hidden rounded-xl border border-slate-200">
              <img src={newProdPreview} alt="Preview" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Descriptions & Extra Info */}
      <div>
        <h4 className="mb-3 font-bold text-slate-800 border-b pb-2">Descriptions</h4>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Short Description</label>
            <input
              type="text"
              value={prod.shortDescription}
              onChange={(e) => setProd({ ...prod, shortDescription: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Full Description</label>
            <textarea
              rows={2}
              value={prod.description || ''}
              onChange={(e) => setProd({ ...prod, description: e.target.value })}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Delivery Info</label>
            <input
              type="text"
              value={prod.deliveryInfo}
              onChange={(e) => setProd({ ...prod, deliveryInfo: e.target.value })}
              placeholder="e.g. 48 hr delivery"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Related Product IDs</label>
            <input
              type="text"
              value={typeof prod.relatedIds === 'string' ? prod.relatedIds : (prod.relatedIds || []).join(', ')}
              onChange={(e) => setProd({ ...prod, relatedIds: e.target.value })}
              placeholder="Comma separated IDs"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>
      </div>

      {/* Supplier */}
      <div>
        <h4 className="mb-3 font-bold text-slate-800 border-b pb-2">Supplier Details</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Name</label>
            <input
              type="text"
              value={prod.supplier?.name || ''}
              onChange={(e) => setProd({ ...prod, supplier: { ...prod.supplier, name: e.target.value } })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Rating</label>
            <input
              type="number"
              step="0.1"
              value={prod.supplier?.rating || ''}
              onChange={(e) => setProd({ ...prod, supplier: { ...prod.supplier, rating: e.target.value } })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">City</label>
            <input
              type="text"
              value={prod.supplier?.city || ''}
              onChange={(e) => setProd({ ...prod, supplier: { ...prod.supplier, city: e.target.value } })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>
      </div>

      {/* Specs */}
      <div>
        <div className="mb-3 flex items-center justify-between border-b pb-2">
          <h4 className="font-bold text-slate-800">Specifications</h4>
          <button
            type="button"
            onClick={() => setProd({ ...prod, specs: [...(prod.specs || []), { label: '', value: '' }] })}
            className="flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-dark"
          >
            <PlusCircle className="h-4 w-4" /> Add Spec
          </button>
        </div>
        <div className="space-y-3">
          {(prod.specs || []).map((spec, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Label (e.g. Type)"
                value={spec.label || ''}
                onChange={(e) => {
                  const newSpecs = [...prod.specs]
                  newSpecs[idx].label = e.target.value
                  setProd({ ...prod, specs: newSpecs })
                }}
                className="w-1/3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <input
                type="text"
                placeholder="Value"
                value={spec.value || ''}
                onChange={(e) => {
                  const newSpecs = [...prod.specs]
                  newSpecs[idx].value = e.target.value
                  setProd({ ...prod, specs: newSpecs })
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="button"
                onClick={() => {
                  const newSpecs = [...prod.specs]
                  newSpecs.splice(idx, 1)
                  setProd({ ...prod, specs: newSpecs })
                }}
                className="text-slate-400 hover:text-red-500"
              >
                <MinusCircle className="h-5 w-5" />
              </button>
            </div>
          ))}
          {(prod.specs || []).length === 0 && (
            <p className="text-xs text-slate-500 italic">No specifications added.</p>
          )}
        </div>
      </div>

      {/* Variants */}
      <div>
        <div className="mb-3 flex items-center justify-between border-b pb-2">
          <h4 className="font-bold text-slate-800">Variants</h4>
          <button
            type="button"
            onClick={() => setProd({ ...prod, variants: [...(prod.variants || []), { id: '', label: '', size: '', unit: '', retailPrice: '', contractorPrice: '', bulkPrice: '', moq: '' }] })}
            className="flex items-center gap-1 text-xs font-bold text-brand hover:text-brand-dark"
          >
            <PlusCircle className="h-4 w-4" /> Add Variant
          </button>
        </div>
        <div className="space-y-4">
          {(prod.variants || []).map((variant, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4 relative">
              <button
                type="button"
                onClick={() => {
                  const newVars = [...prod.variants]
                  newVars.splice(idx, 1)
                  setProd({ ...prod, variants: newVars })
                }}
                className="absolute right-3 top-3 text-slate-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="grid grid-cols-2 gap-3 pr-6 mb-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Variant ID *</label>
                  <input
                    required
                    type="text"
                    value={variant.id || ''}
                    onChange={(e) => { const v = [...prod.variants]; v[idx].id = e.target.value; setProd({...prod, variants: v}) }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Label *</label>
                  <input
                    required
                    type="text"
                    value={variant.label || ''}
                    onChange={(e) => { const v = [...prod.variants]; v[idx].label = e.target.value; setProd({...prod, variants: v}) }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Size</label>
                  <input
                    type="text"
                    value={variant.size || ''}
                    onChange={(e) => { const v = [...prod.variants]; v[idx].size = e.target.value; setProd({...prod, variants: v}) }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Unit</label>
                  <input
                    type="text"
                    value={variant.unit || ''}
                    onChange={(e) => { const v = [...prod.variants]; v[idx].unit = e.target.value; setProd({...prod, variants: v}) }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">MOQ</label>
                  <input
                    type="number"
                    value={variant.moq || ''}
                    onChange={(e) => { const v = [...prod.variants]; v[idx].moq = e.target.value; setProd({...prod, variants: v}) }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Retail Price *</label>
                  <input
                    required
                    type="number"
                    value={variant.retailPrice || ''}
                    onChange={(e) => { const v = [...prod.variants]; v[idx].retailPrice = e.target.value; setProd({...prod, variants: v}) }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Contractor Price *</label>
                  <input
                    required
                    type="number"
                    value={variant.contractorPrice || ''}
                    onChange={(e) => { const v = [...prod.variants]; v[idx].contractorPrice = e.target.value; setProd({...prod, variants: v}) }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Bulk Price</label>
                  <input
                    type="number"
                    value={variant.bulkPrice || ''}
                    onChange={(e) => { const v = [...prod.variants]; v[idx].bulkPrice = e.target.value; setProd({...prod, variants: v}) }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>
          ))}
          {(prod.variants || []).length === 0 && (
            <p className="text-xs text-slate-500 italic">No variants added.</p>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, brands, categories..."
            className="w-full rounded-xl border border-slate-200/60 bg-white/80 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <button
          onClick={() => {
            setNewProd({ ...defaultProd, categoryId: categories[0]?.id || '' })
            setNewProdFile(null)
            setNewProdPreview('')
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          <Plus className="h-4 w-4" />
          Create Product
        </button>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Product Name</th>
                <th className="px-4 py-3 font-semibold">Brand</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((prod) => (
                <tr key={prod.id} className="transition hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 overflow-hidden items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        {prod.images?.[0] ? (
                          <img src={prod.images[0]} alt={prod.name} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-4 w-4" />
                        )}
                      </div>
                      <span className="font-semibold text-slate-800">{prod.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{prod.brand}</td>
                  <td className="px-4 py-3 text-slate-600">{getCategoryName(prod.categoryId)}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {prod.priceLabel ? (prod.priceLabel.includes('₹') ? prod.priceLabel : `₹${prod.priceLabel}`) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                        prod.availability === 'in_stock'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {getStockLabel(prod.availability)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => { 
                          setEditProd({ 
                            ...prod, 
                            supplier: prod.supplier || { ...emptySupplier },
                            specs: prod.specs || [],
                            variants: prod.variants || [],
                            relatedIds: typeof prod.relatedIds === 'string' ? prod.relatedIds : (prod.relatedIds || []).join(', ')
                          }); 
                          setNewProdPreview(prod.images?.[0] || '') 
                        }}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-brand"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteProd(prod)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold">{products.length}</span> of <span className="font-semibold">{total}</span>
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

      {/* Create Modal */}
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
              className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
                <h3 className="text-lg font-bold text-slate-800">Create Product</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5">
                {renderProductForm(newProd, setNewProd, false)}
                <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-5 sticky bottom-0 bg-white shadow-[0_-10px_10px_-10px_rgba(0,0,0,0.1)] -mx-6 px-6 pb-2">
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
                    className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                  >
                    {busy ? 'Saving...' : 'Save Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editProd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => { setEditProd(null); setNewProdFile(null); setNewProdPreview('') }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
                <h3 className="text-lg font-bold text-slate-800">Edit Product</h3>
                <button
                  type="button"
                  onClick={() => { setEditProd(null); setNewProdFile(null); setNewProdPreview('') }}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleEditSave} className="flex-1 overflow-y-auto px-6 py-5">
                {renderProductForm(editProd, setEditProd, true)}
                <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-5 sticky bottom-0 bg-white shadow-[0_-10px_10px_-10px_rgba(0,0,0,0.1)] -mx-6 px-6 pb-2">
                  <button
                    type="button"
                    onClick={() => { setEditProd(null); setNewProdFile(null); setNewProdPreview('') }}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                  >
                    {busy ? 'Updating...' : 'Update Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteProd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setDeleteProd(null)}
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
              <h3 className="mb-1 text-lg font-bold text-slate-800">Delete Product</h3>
              <p className="text-sm text-slate-500">
                Are you sure you want to delete <span className="font-semibold">{deleteProd.name}</span>? This action cannot be undone.
              </p>
              
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteProd(null)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleDelete}
                  className="rounded-xl bg-red-500 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
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
