import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { USER_ROLES, KYC_STATUS } from '../../constants/userRoles.js'
import { getRoleHomePath } from '../../lib/roleHomePath.js'
import { IndividualHomeScreen } from './home/IndividualHomeScreen.jsx'
import { LabourHomeScreen } from './home/LabourHomeScreen.jsx'
import { userSubscriptionApi } from '../../api/userSubscriptionApi.js'

/**
 * For labour users — check trial/subscription gate before rendering dashboard
 */
function LabourGate({ user }) {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Only gate if KYC is verified
    if (user?.labourProfile?.kycStatus !== KYC_STATUS.VERIFIED) {
      setChecking(false)
      return
    }

    userSubscriptionApi.checkAccess()
      .then((res) => {
        const data = res?.data
        if (!data?.hasAccess) {
          navigate('/app/subscription', { replace: true })
        } else {
          setChecking(false)
        }
      })
      .catch(() => {
        // On error, allow access (fail-open)
        setChecking(false)
      })
  }, [user, navigate])

  if (checking) {
    // Brief loading — prevents flash of dashboard before gate redirect
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
      </div>
    )
  }

  return <LabourHomeScreen user={user} />
}

export function AppHomePage() {
  const { user } = useAuth()

  const labourCategories = user?.labourProfile?.categoryIds
  const needsWorkCategories =
    user?.role === USER_ROLES.LABOUR && !(Array.isArray(labourCategories) && labourCategories.length > 0)

  if (needsWorkCategories) {
    return <Navigate to="/app/work-categories" replace />
  }

  if (!user || !user.role || user.role === USER_ROLES.CUSTOMER) {
    return <IndividualHomeScreen user={user} />
  }

  if (user.role === USER_ROLES.LABOUR) {
    return <LabourGate user={user} />
  }

  return <Navigate to={getRoleHomePath(user.role)} replace />
}
