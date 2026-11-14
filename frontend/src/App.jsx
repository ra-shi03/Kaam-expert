import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider.jsx'
import { BrandingProvider } from './context/BrandingContext.jsx'
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx'
import { AppShell } from './layouts/AppShell.jsx'
import { AdminLayout } from './layouts/AdminLayout.jsx'
import { LandingPage } from './pages/LandingPage'
const AuthEntryPage = lazy(() => import('./pages/auth/AuthEntryPage.jsx').then((m) => ({ default: m.AuthEntryPage })))
const LegalPublicPage = lazy(() => import('./pages/legal/LegalPublicPage.jsx').then((m) => ({ default: m.LegalPublicPage })))
const AdminSupportPage = lazy(() => import('./pages/admin/AdminSupportPage.jsx').then((m) => ({ default: m.AdminSupportPage })))
const ReferralLandingPage = lazy(() => import('./pages/ReferralLandingPage.jsx').then((m) => ({ default: m.ReferralLandingPage })))
const LabourCategoriesPage = lazy(() => import('./pages/app/LabourCategoriesPage.jsx').then((m) => ({ default: m.LabourCategoriesPage })))
import { appShellChildRoutes } from './routes/appRoutes.jsx'
import { bootRoutes } from './routes/bootRoutes.jsx'
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage.jsx').then((m) => ({ default: m.AdminCategoriesPage })))
const AdminSubCategoriesPage = lazy(() => import('./pages/admin/AdminSubCategoriesPage.jsx').then((m) => ({ default: m.AdminSubCategoriesPage })))
const AdminServicesPage = lazy(() => import('./pages/admin/AdminServicesPage.jsx').then((m) => ({ default: m.AdminServicesPage })))
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage.jsx').then((m) => ({ default: m.AdminLoginPage })))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx').then((m) => ({ default: m.AdminDashboardPage })))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage.jsx').then((m) => ({ default: m.AdminUsersPage })))
const AdminLabourPage = lazy(() => import('./pages/admin/AdminLabourPage.jsx').then((m) => ({ default: m.AdminLabourPage })))

const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage.jsx').then((m) => ({ default: m.AdminBookingsPage })))

const AdminBillingPage = lazy(() => import('./pages/admin/AdminBillingPage.jsx').then((m) => ({ default: m.AdminBillingPage })))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage.jsx').then((m) => ({ default: m.AdminSettingsPage })))
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage.jsx').then((m) => ({ default: m.AdminReportsPage })))
const AdminZoneManagementPage = lazy(() => import('./pages/admin/AdminZoneManagementPage.jsx').then((m) => ({ default: m.AdminZoneManagementPage })))
const AdminBannersPage = lazy(() => import('./pages/admin/AdminBannersPage.jsx').then((m) => ({ default: m.AdminBannersPage })))
const AdminComplaintsPage = lazy(() => import('./pages/admin/AdminComplaintsPage.jsx').then((m) => ({ default: m.AdminComplaintsPage })))
const AdminProfilePage = lazy(() => import('./pages/admin/AdminProfilePage.jsx').then((m) => ({ default: m.AdminProfilePage })))
const AdminZonesPage = lazy(() => import('./pages/admin/AdminZonesPage.jsx').then((m) => ({ default: m.AdminZonesPage })))
const AdminPlatformFeePage = lazy(() => import('./pages/admin/AdminPlatformFeePage.jsx').then((m) => ({ default: m.AdminPlatformFeePage })))
const AdminCommissionFeePage = lazy(() => import('./pages/admin/AdminCommissionFeePage.jsx').then((m) => ({ default: m.AdminCommissionFeePage })))
const AdminLabourWalletPage = lazy(() => import('./pages/admin/AdminLabourWalletPage.jsx').then((m) => ({ default: m.AdminLabourWalletPage })))
const AdminCashManagementPage = lazy(() => import('./pages/admin/AdminCashManagementPage.jsx').then((m) => ({ default: m.AdminCashManagementPage })))
const AdminReviewsRatingsPage = lazy(() => import('./pages/admin/AdminReviewsRatingsPage.jsx').then((m) => ({ default: m.AdminReviewsRatingsPage })))
const AdminLabourSubscriptionsPage = lazy(() => import('./pages/admin/AdminLabourSubscriptionsPage.jsx').then((m) => ({ default: m.AdminLabourSubscriptionsPage })))
const AdminFreeTrialPage = lazy(() => import('./pages/admin/AdminFreeTrialPage.jsx').then((m) => ({ default: m.AdminFreeTrialPage })))
const AdminPrivacyPolicyPage = lazy(() => import('./pages/admin/AdminPrivacyPolicyPage.jsx').then((m) => ({ default: m.AdminPrivacyPolicyPage })))
const AdminTermsConditionsPage = lazy(() => import('./pages/admin/AdminTermsConditionsPage.jsx').then((m) => ({ default: m.AdminTermsConditionsPage })))
const AdminFAQsPage = lazy(() => import('./pages/admin/AdminFAQsPage.jsx').then((m) => ({ default: m.AdminFAQsPage })))
const AdminCancellationPolicyPage = lazy(() => import('./pages/admin/AdminCancellationPolicyPage.jsx').then((m) => ({ default: m.AdminCancellationPolicyPage })))
const AdminRefundPolicyPage = lazy(() => import('./pages/admin/AdminRefundPolicyPage.jsx').then((m) => ({ default: m.AdminRefundPolicyPage })))
const AdminReferralsPage = lazy(() => import('./pages/admin/AdminReferralsPage.jsx').then((m) => ({ default: m.AdminReferralsPage })))
const AdminBonusesPage = lazy(() => import('./pages/admin/AdminBonusesPage.jsx').then((m) => ({ default: m.AdminBonusesPage })))

import { NotificationSoundListener } from './components/app/NotificationSoundListener.jsx'
import { BroadcastPopup } from './components/app/BroadcastPopup.jsx'
import { ViewportLock } from './components/app/ViewportLock.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { lazy, Suspense, useEffect } from 'react'
import { APP_B2C_ROLES } from './constants/panelRoles.js'
import { USER_ROLES } from './constants/userRoles.js'
import { initializePushNotifications, setupForegroundNotificationHandler } from './services/pushNotificationService.js'

function App() {
  useEffect(() => {
    initializePushNotifications();
    setupForegroundNotificationHandler((payload) => {
      // You can replace this with a custom toast notification library like react-hot-toast if desired
      if (payload?.notification && payload?.data?.type !== 'booking_received') {
        alert(`New Notification: ${payload.notification.title}\n${payload.notification.body}`);
      }
      if (payload.data?.link) {
        // Optional navigation handling based on data payload
        console.log('Navigating to', payload.data.link);
      }
    });
  }, []);

  return (
    <BrowserRouter>
      <ViewportLock />
      <BrandingProvider>
        <AuthProvider>
        <Suspense fallback={<div className="min-h-dvh bg-white" />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {bootRoutes}
          <Route path="/auth" element={<Navigate to="/users/auth" replace />} />
          <Route path="/users/auth" element={<AuthEntryPage authGroup="users" />} />
          <Route path="/labours/auth" element={<AuthEntryPage authGroup="labours" />} />
          {['users', 'labours'].map((audience) => (
            <Route key={audience}>
              <Route path={`/${audience}/privacy-policy`} element={<LegalPublicPage audience={audience} type="privacy" />} />
              <Route path={`/${audience}/terms-and-conditions`} element={<LegalPublicPage audience={audience} type="terms" />} />
              <Route path={`/${audience}/support`} element={<LegalPublicPage audience={audience} type="support" />} />
            </Route>
          ))}
          <Route path="/r/:code" element={<ReferralLandingPage />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute roles={APP_B2C_ROLES} allowGuest>
                <ErrorBoundary>
                  <AppShell />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          >
            {appShellChildRoutes}
          </Route>
          <Route
            path="/app/work-categories"
            element={
              <ProtectedRoute roles={[USER_ROLES.LABOUR]}>
                <ErrorBoundary>
                  <LabourCategoriesPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route path="/admin/login" element={<AdminLoginPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={[USER_ROLES.ADMIN]}>
                <ErrorBoundary>
                  <AdminLayout />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="sub-categories" element={<AdminSubCategoriesPage />} />
            <Route path="services" element={<AdminServicesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="referrals" element={<AdminReferralsPage />} />
            <Route path="labour" element={<AdminLabourPage />} />

            <Route path="bookings" element={<AdminBookingsPage />} />

            <Route path="billing" element={<AdminBillingPage />} />
            <Route path="banners" element={<AdminBannersPage />} />
            <Route path="complaints" element={<AdminComplaintsPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="zones" element={<AdminZonesPage />} />
            <Route path="zone-management" element={<AdminZoneManagementPage />} />
            <Route path="platform-fee" element={<AdminPlatformFeePage />} />
            <Route path="commission-fee" element={<AdminCommissionFeePage />} />
            <Route path="labour-wallet" element={<AdminLabourWalletPage />} />
            <Route path="bonuses" element={<AdminBonusesPage />} />
            <Route path="cash-management" element={<AdminCashManagementPage />} />
            <Route path="reviews" element={<AdminReviewsRatingsPage />} />
            <Route path="labour-subscriptions" element={<AdminLabourSubscriptionsPage />} />
            <Route path="free-trials" element={<AdminFreeTrialPage />} />
            <Route path="privacy-policy" element={<AdminPrivacyPolicyPage />} />
            <Route path="terms-conditions" element={<AdminTermsConditionsPage />} />
            <Route path="support-page" element={<AdminSupportPage />} />
            <Route path="faqs" element={<AdminFAQsPage />} />
            <Route path="cancellation-policy" element={<AdminCancellationPolicyPage />} />
            <Route path="refund-policy" element={<AdminRefundPolicyPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        <BroadcastPopup />
        <NotificationSoundListener />
        </AuthProvider>
      </BrandingProvider>
    </BrowserRouter>
  )
}

export default App
