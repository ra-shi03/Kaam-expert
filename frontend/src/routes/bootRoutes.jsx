import { lazy } from 'react'
import { Route } from 'react-router-dom'
const RoleSelectPage = lazy(() => import('../pages/boot/RoleSelectPage.jsx').then((m) => ({ default: m.RoleSelectPage })))
const SplashPage = lazy(() => import('../pages/boot/SplashPage.jsx').then((m) => ({ default: m.SplashPage })))

/** Public mobile bootstrap routes (splash → role select). */
export const bootRoutes = (
  <>
    <Route path="/splash" element={<SplashPage />} />
    <Route path="/onboarding/role" element={<RoleSelectPage />} />
  </>
)
