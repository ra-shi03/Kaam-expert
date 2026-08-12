import { motion, AnimatePresence } from 'framer-motion'
import { X, PackageSearch, Tag, Info, Truck, IndianRupee, MapPin } from 'lucide-react'

export function ViewMartProductModal({ product, open, onClose }) {
  if (!product) return null

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
                <p className="text-sm text-slate-500">{product.brand} • {product.categoryId}</p>
              </div>
              <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-8 lg:grid-cols-2">
                
                {/* Left Column: Images & Basic Info */}
                <div className="space-y-6">
                  <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
                    {product.images?.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><PackageSearch className="h-12 w-12 text-slate-300" /></div>
                    )}
                  </div>
                  {product.images?.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {product.images.slice(1).map((img, i) => (
                        <img key={i} src={img} alt="" className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 object-cover" />
                      ))}
                    </div>
                  )}

                  <div>
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">Descriptions</h3>
                    <p className="mb-3 text-sm font-medium text-slate-800">{product.shortDescription || 'No short description provided.'}</p>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{product.description || 'No detailed description provided.'}</p>
                  </div>
                </div>

                {/* Right Column: Specs, Variants, Delivery */}
                <div className="space-y-6">
                  
                  <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1"><IndianRupee className="w-3.5 h-3.5" /> Price Label</div>
                      <div className="font-semibold text-brand">{product.priceLabel}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1"><Info className="w-3.5 h-3.5" /> Availability</div>
                      <div className="font-semibold text-slate-800 capitalize">{product.availability?.replace('_', ' ')}</div>
                    </div>
                    <div className="col-span-2 border-t border-slate-200/60 pt-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-1"><Truck className="w-3.5 h-3.5" /> Delivery Info</div>
                      <div className="font-semibold text-slate-800">{product.deliveryInfo || 'Not specified'}</div>
                    </div>
                  </div>

                  {product.specs?.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Specifications</h3>
                      <div className="rounded-xl border border-slate-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <tbody className="divide-y divide-slate-100">
                            {product.specs.map((spec, i) => (
                              <tr key={i} className="bg-white even:bg-slate-50">
                                <td className="py-2.5 px-4 font-semibold text-slate-600">{spec.label}</td>
                                <td className="py-2.5 px-4 text-slate-800">{spec.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {product.variants?.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Variants ({product.variantCount})</h3>
                      <div className="space-y-3">
                        {product.variants.map((v, i) => (
                          <div key={i} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-slate-900">{v.label}</span>
                              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{v.id}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div>
                                <span className="block text-slate-400 mb-0.5">Size/Unit</span>
                                <span className="font-semibold text-slate-700">{v.size} {v.unit}</span>
                              </div>
                              <div>
                                <span className="block text-slate-400 mb-0.5">Retail</span>
                                <span className="font-semibold text-blue-600">₹{v.retailPrice}</span>
                              </div>
                              <div>
                                <span className="block text-slate-400 mb-0.5">Contractor</span>
                                <span className="font-semibold text-blue-600">₹{v.contractorPrice}</span>
                              </div>
                              {v.bulkPrice ? (
                                <div>
                                  <span className="block text-slate-400 mb-0.5">Bulk (MOQ: {v.moq})</span>
                                  <span className="font-semibold text-purple-600">₹{v.bulkPrice}</span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {product.supplier?.name && (
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Supplier Info</h3>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="font-bold text-slate-800">{product.supplier.name}</div>
                        <div className="text-xs text-slate-500 mt-1 flex gap-3">
                          {product.supplier.city && <span><MapPin className="inline w-3 h-3 mr-0.5" />{product.supplier.city}</span>}
                          {product.supplier.rating > 0 && <span>⭐ {product.supplier.rating}/5</span>}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-right">
              <button onClick={onClose} className="rounded-xl bg-slate-800 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900 active:scale-95">
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
