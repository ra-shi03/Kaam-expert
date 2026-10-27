import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMe } from '../api/authApi.js'
import { setUser } from '../store/slices/authSlice.js'
import { getLabourSocket } from './useLabourSocket.js'
import { KYC_STATUS, USER_ROLES } from '../constants/userRoles.js'

/**
 * Keeps a labourer's KYC status fresh (and surfaces the cash-wallet recharge notice): refreshes the profile the moment an admin decides (socket),
 * and re-checks on focus / every 30s while KYC is not verified. Returns a notice to show once.
 */
export function useKycStatusSync(user) {
  const dispatch = useDispatch()
  const token = useSelector((state) => state.auth.token)
  const [notice, setNotice] = useState(null)
  const isLabour = user?.role === USER_ROLES.LABOUR
  const kyc = user?.labourProfile?.kycStatus

  useEffect(() => {
    if (!isLabour || !token) return undefined
    const refresh = () =>
      fetchMe()
        .then((res) => {
          if (res.data?.user) dispatch(setUser(res.data.user))
        })
        .catch(() => {})

    const socket = getLabourSocket(token)
    const onUpdate = (data) => {
      setNotice({ status: data?.status, title: data?.title, body: data?.body })
      refresh()
    }
    socket?.on('KYC_STATUS_UPDATE', onUpdate)
    const onRecharge = (data) => {
      setNotice({
        status: 'recharge',
        title: data?.title,
        body: data?.body,
        href: `/app/wallet?recharge=${data?.shortfall || ''}`,
      })
    }
    socket?.on('CASH_WALLET_RECHARGE_REQUIRED', onRecharge)

    let timer
    if (kyc !== KYC_STATUS.VERIFIED) {
      timer = setInterval(refresh, 30000)
      window.addEventListener('focus', refresh)
    }
    return () => {
      socket?.off('KYC_STATUS_UPDATE', onUpdate)
      socket?.off('CASH_WALLET_RECHARGE_REQUIRED', onRecharge)
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [isLabour, token, kyc, dispatch])

  return { notice, dismissNotice: () => setNotice(null) }
}
