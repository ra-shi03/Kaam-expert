import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Camera,
  ChevronRight,
  ClipboardList,
  FileText,
  Fingerprint,
  HardHat,
  Home,
  IdCard,
  LifeBuoy,
  Loader2,
  LogOut,
  Mail,
  Menu,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  Wrench,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { BOOT_ROUTES } from '../../constants/bootFlow.js'
import { useAuth } from '../../hooks/useAuth.js'
import {
  KYC_STATUS,
  ROLE_LABELS,
  USER_ROLES,
} from '../../constants/userRoles.js'
import { adminInitials, formatLastLoginRelative } from '../../lib/formatAdminLastLogin.js'
import { assetUrlFromUpload, uploadMedia } from '../../api/uploadApi.js'
import { UPLOAD_FOLDERS } from '../../constants/uploadFolders.js'
import { AppBadge } from '../../components/app-ui/data-display/AppBadge.jsx'
import { AppSectionHeader } from '../../components/app-ui/layout/AppSectionHeader.jsx'
import { AppModal } from '../../components/app-ui/feedback/AppModal.jsx'
import { AppTextInput } from '../../components/app-ui/inputs/AppTextInput.jsx'
import { AppButton } from '../../components/app-ui/buttons/AppButton.jsx'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { patchCurrentUser, deleteCurrentUser } from '../../api/userProfileApi.js'
import { ApiError } from '../../api/http.js'
import { setUser } from '../../store/slices/authSlice.js'

function openAppDrawer() {
  window.dispatchEvent(new Event('lc-open-app-drawer'))
}

function roleStatusPill(user) {
  const role = user?.role
  if (role === USER_ROLES.LABOUR && user?.labourProfile?.kycStatus) {
    const k = user.labourProfile.kycStatus
    if (k === KYC_STATUS.PENDING) return { label: 'KYC pending', variant: 'amber' }
    if (k === KYC_STATUS.FAILED) return { label: 'KYC needs attention', variant: 'rose' }
    if (k === KYC_STATUS.VERIFIED) return { label: 'KYC verified', variant: 'emerald' }
  }
  return null
}

function ProfileScreenHeader() {
  return (
    <motion.div className="pb-1">
      <div className="flex items-start gap-2 sm:gap-3">
        <Link
          to="/app"
          className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-slate-800 shadow-sm transition hover:border-brand/35 hover:text-brand"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Account</p>
          <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-900">Profile</h1>
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
            Your identity, verification status, and app shortcuts.
          </p>
        </div>
        <button
          type="button"
          onClick={openAppDrawer}
          className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition hover:border-brand/35 hover:text-brand"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </motion.div>
  )
}

function StatTile({ icon: Icon, label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-50 text-slate-800 ring-slate-200/80',
    brand: 'bg-brand/8 text-brand ring-brand/20',
    emerald: 'bg-blue-50 text-blue-900 ring-blue-200/80',
    amber: 'bg-amber-50 text-amber-950 ring-amber-200/80',
  }
  return (
    <div className={`rounded-2xl px-3 py-2.5 ring-1 ${tones[tone] || tones.slate}`}>
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <p className="mt-1 text-xs font-bold leading-snug">{value}</p>
    </div>
  )
}

function DetailRow({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100/90 py-3.5 last:border-0">
      <div className="flex min-w-0 items-start gap-2.5 text-slate-500">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-200/80">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wide">{label}</span>
          {sub ? <span className="mt-0.5 block text-[10px] font-medium normal-case text-slate-400">{sub}</span> : null}
        </div>
      </div>
      <span className="max-w-[58%] shrink-0 text-right text-sm font-semibold text-slate-900">{value}</span>
    </div>
  )
}

function QuickLinkCard({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-3 shadow-sm transition hover:border-brand/30 hover:shadow-md active:scale-[0.99]"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="truncate text-sm font-bold text-slate-800">{label}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand" aria-hidden />
    </Link>
  )
}

export function AppProfilePage() {
  const { user, token, logout, setBootRole } = useAuth()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const reduce = useReducedMotion()
  const photoInputRef = useRef(null)

  const [photoSaving, setPhotoSaving] = useState(false)
  const [photoErr, setPhotoErr] = useState('')
  const [localPreview, setLocalPreview] = useState(null)

  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [editNameValue, setEditNameValue] = useState('')
  const [editPhoneValue, setEditPhoneValue] = useState('')
  const [editEmailValue, setEditEmailValue] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileErr, setProfileErr] = useState('')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteErr, setDeleteErr] = useState('')

  const labourCategories = user?.labourProfile?.categoryIds
  const labourKyc = user?.labourProfile?.kycStatus
  const statusPill = roleStatusPill(user)
  const initials = adminInitials(user)
  const lastActive = formatLastLoginRelative(user?.lastLoginAt)
  const memberSince =
    user?.createdAt && !Number.isNaN(new Date(user.createdAt).getTime())
      ? new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })
      : '—'

  const savedPhoto = user?.profileImageUrl?.trim() || ''
  const displayPhoto = localPreview || savedPhoto

  const saveProfilePhoto = useCallback(
    async (imageUrl) => {
      setPhotoErr('')
      setPhotoSaving(true)
      try {
        const res = await patchCurrentUser({ profileImageUrl: imageUrl })
        dispatch(setUser(res.data.user))
        setLocalPreview(null)
      } catch (e) {
        setPhotoErr(e instanceof ApiError ? e.message : 'Could not save profile photo')
        setLocalPreview(null)
      } finally {
        setPhotoSaving(false)
      }
    },
    [dispatch],
  )

  const onPickPhoto = useCallback(
    async (e) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      setPhotoErr('')
      if (!file) return
      if (!file.type.startsWith('image/')) {
        setPhotoErr('Please choose a photo (JPG, PNG, or WebP) from your device.')
        return
      }
      const previewUrl = URL.createObjectURL(file)
      setLocalPreview(previewUrl)
      try {
        const uploaded = await uploadMedia(file, UPLOAD_FOLDERS.PROFILES)
        const url = assetUrlFromUpload(uploaded)
        if (!url) {
          setPhotoErr('Upload failed — no URL returned.')
          setLocalPreview(null)
          return
        }
        await saveProfilePhoto(url)
      } catch (err) {
        setPhotoErr(err instanceof ApiError ? err.message : 'Could not upload photo.')
        setLocalPreview(null)
      } finally {
        URL.revokeObjectURL(previewUrl)
      }
    },
    [saveProfilePhoto],
  )

  const removePhoto = useCallback(async () => {
    setPhotoErr('')
    setLocalPreview(null)
    setPhotoSaving(true)
    try {
      const res = await patchCurrentUser({ profileImageUrl: null })
      dispatch(setUser(res.data.user))
    } catch (e) {
      setPhotoErr(e instanceof ApiError ? e.message : 'Could not remove photo')
    } finally {
      setPhotoSaving(false)
    }
  }, [dispatch])

  const handleEditProfileOpen = useCallback(() => {
    setEditNameValue(user?.fullName || '')
    setEditPhoneValue(user?.phone || '')
    setEditEmailValue(user?.email || '')
    setProfileErr('')
    setEditProfileOpen(true)
  }, [user])

  const handleSaveProfile = useCallback(async (e) => {
    e.preventDefault()
    const trimmedName = editNameValue.trim()
    const trimmedPhone = editPhoneValue.trim()
    const trimmedEmail = editEmailValue.trim()
    
    if (!trimmedName) {
      setProfileErr('Name cannot be empty')
      return
    }
    if (trimmedPhone && !/^\d{10}$/.test(trimmedPhone)) {
      setProfileErr('Enter a valid 10-digit phone number')
      return
    }
    
    setSavingProfile(true)
    setProfileErr('')
    try {
      const res = await patchCurrentUser({ 
        fullName: trimmedName,
        phone: trimmedPhone || undefined,
        email: trimmedEmail || undefined
      })
      dispatch(setUser(res.data.user))
      setEditProfileOpen(false)
    } catch (err) {
      setProfileErr(err instanceof ApiError ? err.message : 'Could not save profile')
    } finally {
      setSavingProfile(false)
    }
  }, [editNameValue, editPhoneValue, editEmailValue, dispatch])

  const handleToggleRole = useCallback(async () => {
    const newRole = user?.role === USER_ROLES.CUSTOMER ? USER_ROLES.CONTRACTOR : USER_ROLES.CUSTOMER
    try {
      const res = await patchCurrentUser({ role: newRole })
      dispatch(setUser(res.data.user))
    } catch (err) {
      console.error(err)
    }
  }, [user, dispatch])

  const handleSignOut = async () => {
    await logout()
    navigate('/auth', { replace: true })
  }

  const handleDeleteAccount = useCallback(async () => {
    setDeletingAccount(true)
    setDeleteErr('')
    try {
      await deleteCurrentUser()
      await logout()
      navigate('/auth', { replace: true })
    } catch (err) {
      setDeleteErr(err instanceof ApiError ? err.message : 'Could not delete account')
      setDeletingAccount(false)
    }
  }, [logout, navigate])

  const quickLinks = []
  quickLinks.push({ to: '/app', icon: Home, label: 'Home' })
  if (user?.role === USER_ROLES.LABOUR) {
    quickLinks.push({ to: '/app/jobs', icon: HardHat, label: 'Jobs & assignments' })
    quickLinks.push({ to: '/app/my-bookings', icon: CalendarClock, label: 'My Bookings (Direct)' })
    quickLinks.push({ to: '/app/kyc', icon: Fingerprint, label: 'Aadhaar KYC' })
    quickLinks.push({ to: '/app/earnings', icon: Sparkles, label: 'Earnings & payouts' })
  } else {
    quickLinks.push({
      to: '/app/my-bookings',
      icon: CalendarClock,
      label: user?.role === USER_ROLES.CONTRACTOR ? 'Bookings & requests' : 'Bookings',
    })
  }
  if (user?.role === USER_ROLES.CONTRACTOR) {
    quickLinks.push({ to: '/app/billing', icon: FileText, label: 'Billing & contracts' })
  }
  if (user?.role === USER_ROLES.CONTRACTOR) {
    quickLinks.push({ to: '/app/workforce', icon: ClipboardList, label: 'Workforce' })
  }
  quickLinks.push({ to: '/app/support', icon: LifeBuoy, label: 'Support' })

  return (
    <motion.div
      className="w-full min-w-0 max-w-full space-y-5 overflow-x-hidden bg-linear-to-b from-slate-50/95 via-white to-blue-50/15 pb-28 pt-1"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <ProfileScreenHeader />

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="overflow-hidden rounded-3xl border border-slate-200/90 bg-linear-to-br from-white via-white to-brand/[0.07] p-4 shadow-[0_20px_48px_-28px_rgba(15,23,42,0.18)] ring-1 ring-slate-100/90"
      >
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={photoSaving}
            className="group relative shrink-0 rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-70"
            aria-label="Change profile photo"
          >
            <span className="relative block h-24 w-24 overflow-hidden rounded-3xl bg-linear-to-br from-brand-bright to-brand text-2xl font-black text-white shadow-[0_16px_40px_-12px_rgba(0,43,92,0.55)] ring-2 ring-white">
              {displayPhoto ? (
                <img src={displayPhoto} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center">{initials}</span>
              )}
              {photoSaving ? (
                <span className="absolute inset-0 flex items-center justify-center bg-slate-900/45 backdrop-blur-[2px]">
                  <Loader2 className="h-7 w-7 animate-spin text-white" aria-hidden />
                </span>
              ) : null}
            </span>
            <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-lg ring-2 ring-white transition group-hover:scale-105">
              <Pencil className="h-4 w-4" aria-hidden />
            </span>
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="sr-only"
            onChange={(e) => void onPickPhoto(e)}
          />

          <div className="mt-4 min-w-0 flex-1 sm:mt-0 sm:ml-4">
            <p className="truncate text-xl font-black tracking-tight text-slate-900">
              {user?.fullName || 'Your profile'}
            </p>
            <p className="mt-1 text-sm font-semibold text-brand">{ROLE_LABELS[user?.role] || user?.role || '—'}</p>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500 sm:justify-start">
              <Camera className="h-3.5 w-3.5" aria-hidden />
              Tap photo to upload from your device
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {user?.isPhoneVerified ? (
                <AppBadge variant="emerald" uppercase={false}>
                  Phone verified
                </AppBadge>
              ) : (
                <AppBadge variant="amber" uppercase={false}>
                  Phone not verified
                </AppBadge>
              )}
              {statusPill ? (
                <AppBadge variant={statusPill.variant} uppercase={false}>
                  {statusPill.label}
                </AppBadge>
              ) : null}
              {user?.isActive === false ? (
                <AppBadge variant="rose" uppercase={false}>
                  Inactive
                </AppBadge>
              ) : null}
            </div>
            {displayPhoto && !photoSaving ? (
              <button
                type="button"
                onClick={() => void removePhoto()}
                className="mt-2 text-[11px] font-bold text-slate-500 underline-offset-2 hover:text-rose-600 hover:underline"
              >
                Remove photo
              </button>
            ) : null}
            {photoErr ? <p className="mt-2 text-xs font-medium text-rose-700">{photoErr}</p> : null}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
          {/* <StatTile
            icon={Phone}
            label="Mobile"
            value={user?.phone ? `+91 ${user.phone.slice(-10)}` : '—'}
            tone={user?.isPhoneVerified ? 'emerald' : 'amber'}
          /> */}
          <StatTile icon={CalendarClock} label="Member" value={memberSince} />
          <StatTile icon={ShieldCheck} label="Active" value={lastActive || '—'} />
        </div>
      </motion.section>

      {user?.role === USER_ROLES.LABOUR ? (
        <Link
          to="/app/kyc"
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 shadow-sm transition active:scale-[0.99] ${
            labourKyc === KYC_STATUS.VERIFIED
              ? 'border-blue-200/80 bg-blue-50/80'
              : labourKyc === KYC_STATUS.FAILED
                ? 'border-rose-200/80 bg-rose-50/60'
                : 'border-amber-200/80 bg-amber-50/70'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Fingerprint className="h-5 w-5 shrink-0 text-brand" aria-hidden />
            <span className="text-left">
              <span className="block text-sm font-bold text-slate-900">Aadhaar verification</span>
              <span className="block text-[11px] font-medium text-slate-600">
                {labourKyc === KYC_STATUS.VERIFIED
                  ? user?.labourProfile?.aadhaarMasked || 'Verified on file'
                  : labourKyc === KYC_STATUS.FAILED
                    ? 'Needs resubmission'
                    : user?.labourProfile?.kycSubmittedAt
                      ? 'Under admin review'
                      : 'Submit documents to get jobs'}
              </span>
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
        </Link>
      ) : null}

      <GlassPanel className="border-slate-200/90 p-4 ring-1 ring-slate-100/90">
        <AppSectionHeader title="Account details" className="mb-1" />
        <DetailRow 
          icon={Sparkles} 
          label="Full name" 
          value={
            <div className="flex items-center justify-end gap-2">
              <span className="truncate">{user?.fullName || '—'}</span>
              <button
                type="button"
                onClick={handleEditProfileOpen}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-brand/10 hover:text-brand"
                aria-label="Edit name"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          } 
        />
        <DetailRow
          icon={Phone}
          label="Mobile"
          value={
            <div className="flex items-center justify-end gap-2">
              <span className="truncate">{user?.phone ? `+91 ${user.phone}` : '—'}</span>
              <button
                type="button"
                onClick={handleEditProfileOpen}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-brand/10 hover:text-brand"
                aria-label="Edit phone"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          }
          sub="Used for OTP sign-in"
        />
        <DetailRow 
          icon={Mail} 
          label="Email" 
          value={
            <div className="flex items-center justify-end gap-2">
              <span className="truncate">{user?.email?.trim() || '—'}</span>
              <button
                type="button"
                onClick={handleEditProfileOpen}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-brand/10 hover:text-brand"
                aria-label="Edit email"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          } 
          sub="Optional on your account" 
        />
        <DetailRow icon={ShieldCheck} label="Last session" value={lastActive || '—'} />
      </GlassPanel>

      {(user?.role === USER_ROLES.CUSTOMER || user?.role === USER_ROLES.CONTRACTOR) && (
        <GlassPanel className="border-slate-200/90 p-4 ring-1 ring-slate-100/90 flex flex-col items-center justify-center text-center">
          <Building2 className="h-8 w-8 text-brand mb-2" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {user?.role === USER_ROLES.CUSTOMER ? 'Looking for bulk bookings?' : 'Looking for individual bookings?'}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {user?.role === USER_ROLES.CUSTOMER
              ? 'Switch to Contractor mode to book multiple workers and manage bulk projects.'
              : 'Switch to Individual mode for regular home services and single bookings.'}
          </p>
          <AppButton type="button" variant="secondary" onClick={handleToggleRole} className="w-full">
            Switch to {user?.role === USER_ROLES.CUSTOMER ? 'Contractor Mode' : 'Individual Mode'}
          </AppButton>
        </GlassPanel>
      )}


      {user?.role === USER_ROLES.LABOUR ? (
        <GlassPanel className="border-slate-200/90 p-4 ring-1 ring-slate-100/90">
          <AppSectionHeader title="Worker profile" className="mb-3" />
          {labourCategories?.length ? (
            <>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Work types</p>
              <div className="flex flex-wrap gap-2">
                {labourCategories.map((c) => (
                  <span
                    key={typeof c === 'object' && c?._id ? c._id : String(c)}
                    className="rounded-full border border-brand/20 bg-brand/8 px-3 py-1.5 text-xs font-semibold text-slate-800 ring-1 ring-brand/10"
                  >
                    {typeof c === 'object' && c?.name ? c.name : '…'}
                  </span>
                ))}
              </div>
              <Link
                to="/app/work-categories"
                className="mt-4 flex items-center justify-center gap-1 rounded-xl border border-brand/25 bg-brand/8 py-2.5 text-sm font-bold text-brand transition hover:bg-brand/12"
              >
                Update work types
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/80 p-4 text-center">
              <p className="text-sm font-semibold text-slate-800">Choose your trades</p>
              <p className="mt-1 text-xs text-slate-600">Pick categories so we can match you to the right jobs.</p>
              <Link
                to="/app/work-categories"
                className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand"
              >
                <Wrench className="h-4 w-4" aria-hidden />
                Set work types
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          )}
        </GlassPanel>
      ) : null}

      <section>
        <AppSectionHeader title="Shortcuts" className="mb-3 px-0.5" />
        <ul className="space-y-2">
          {quickLinks.map((link) => (
            <li key={link.to}>
              <QuickLinkCard to={link.to} icon={link.icon} label={link.label} />
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.99]"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Sign out
      </button>

      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200/90 bg-rose-50/90 py-3.5 text-sm font-bold text-rose-900 shadow-sm transition hover:bg-rose-50 active:scale-[0.99]"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        Delete account
      </button>

      <AppModal 
        open={editProfileOpen} 
        onClose={() => !savingProfile && setEditProfileOpen(false)} 
        title="Edit Profile"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label htmlFor="edit-full-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Full Name
            </label>
            <AppTextInput
              id="edit-full-name"
              placeholder="e.g. Rahul Kumar"
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              disabled={savingProfile}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="edit-phone" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Mobile Number
            </label>
            <AppTextInput
              id="edit-phone"
              type="tel"
              placeholder="10-digit number"
              value={editPhoneValue}
              onChange={(e) => setEditPhoneValue(e.target.value.replace(/\D/g, '').slice(0, 10))}
              disabled={savingProfile}
            />
          </div>
          <div>
            <label htmlFor="edit-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Email Address
            </label>
            <AppTextInput
              id="edit-email"
              type="email"
              placeholder="e.g. rahul@example.com"
              value={editEmailValue}
              onChange={(e) => setEditEmailValue(e.target.value)}
              disabled={savingProfile}
            />
          </div>
          
          {profileErr ? <p className="mt-1.5 text-xs font-medium text-rose-600">{profileErr}</p> : null}
          
          <div className="flex gap-3 pt-2">
            <AppButton 
              type="button" 
              variant="secondary" 
              onClick={() => setEditProfileOpen(false)} 
              disabled={savingProfile}
            >
              Cancel
            </AppButton>
            <AppButton type="submit" loading={savingProfile}>
              Save
            </AppButton>
          </div>
        </form>
      </AppModal>

      <AppModal 
        open={deleteOpen} 
        onClose={() => !deletingAccount && setDeleteOpen(false)} 
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
             <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
               <AlertTriangle className="size-5" />
             </div>
             <div>
               <p className="text-sm text-slate-600">
                 Are you sure you want to delete your account? This action cannot be undone and will permanently remove your data, verified documents, and access.
               </p>
             </div>
          </div>
          {deleteErr ? <p className="mt-1.5 text-xs font-medium text-rose-600">{deleteErr}</p> : null}
          <div className="flex gap-3 pt-2">
            <AppButton 
              type="button" 
              variant="secondary" 
              onClick={() => setDeleteOpen(false)} 
              disabled={deletingAccount}
            >
              Cancel
            </AppButton>
            <button
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
            >
              {deletingAccount ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete
            </button>
          </div>
        </div>
      </AppModal>
    </motion.div>
  )
}
