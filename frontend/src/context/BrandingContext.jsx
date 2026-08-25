import { createContext, useContext, useEffect, useState } from 'react'
import { getPublicSettings } from '../api/adminSettingsApi.js'

const BrandingContext = createContext({
  logoUrl: '/logo-transparent.png',
  faviconUrl: '/favicon.ico',
})

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState({
    logoUrl: '/logo-transparent.png',
    faviconUrl: '/favicon.ico',
  })

  useEffect(() => {
    let mounted = true
    getPublicSettings()
      .then(res => {
        if (!mounted) return
        const b = res.data?.branding
        if (b) {
          const newBranding = {
            logoUrl: b.logoUrl || '/logo-transparent.png',
            faviconUrl: b.faviconUrl || '/favicon.ico',
          }
          setBranding(newBranding)
          
          // Update favicon dynamically
          if (b.faviconUrl) {
            let link = document.querySelector("link[rel~='icon']")
            if (!link) {
              link = document.createElement('link')
              link.rel = 'icon'
              document.head.appendChild(link)
            }
            link.removeAttribute('type') // Remove hardcoded SVG type so any image format works
            link.href = b.faviconUrl
          }
        }
      })
      .catch(console.error)
      
    return () => { mounted = false }
  }, [])

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  )
}

export const useBranding = () => useContext(BrandingContext)
