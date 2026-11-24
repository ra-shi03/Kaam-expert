import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { USER_ROLES } from '../../constants/userRoles.js'
import { getRoleHomePath } from '../../lib/roleHomePath.js'
import { AppRouteLoader } from '../app/AppRouteLoader.jsx'

export function ProtectedRoute({ children, roles, allowGuest }) {
  const { isAuthenticated, user, isGuest, loading } = useAuth()
  const location = useLocation()
  const role = user?.role

  useEffect(() => {
    if (role) {
      try {
        localStorage.setItem(
          'lc_last_auth_group',
          role === USER_ROLES.LABOUR ? 'labours' : 'users',
        )
      } catch {}
    }
  }, [role])

  if (loading) {
    return <AppRouteLoader />
  }

  // An active session is authenticated, or an explicit boot guest if allowGuest is set.
  // Logged-out users (no token, no bootRole) are blocked and redirected to login.
  const canAccess = Boolean(isAuthenticated || (allowGuest && isGuest))
  if (!canAccess) {
    let lastGroup = null
    try {
      lastGroup = localStorage.getItem('lc_last_auth_group')
    } catch {}
    const isLabour =
      lastGroup === 'labours' ||
      role === USER_ROLES.LABOUR ||
      location.pathname.startsWith('/app/work-categories')
    const loginTarget = isLabour ? '/labours/auth' : '/users/auth'
    return <Navigate to={loginTarget} replace state={{ from: location.pathname + location.search }} />
  }

  if (roles?.length && role && !roles.includes(role)) {
    return <Navigate to={getRoleHomePath(role)} replace />
  }

  return children
}
