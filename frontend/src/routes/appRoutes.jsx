import { lazy } from 'react'
import { Navigate, Route } from 'react-router-dom'
import { RoleRoute } from '../components/auth/RoleRoute.jsx'
const AppHomePage = lazy(() => import('../pages/app/AppHomePage.jsx').then((m) => ({ default: m.AppHomePage })))
const AppBookingsPage = lazy(() => import('../pages/app/AppBookingsPage.jsx').then((m) => ({ default: m.AppBookingsPage })))
const AppJobsPage = lazy(() => import('../pages/app/AppJobsPage.jsx').then((m) => ({ default: m.AppJobsPage })))
const AppSupportPage = lazy(() => import('../pages/app/AppSupportPage.jsx').then((m) => ({ default: m.AppSupportPage })))
const AppProfilePage = lazy(() => import('../pages/app/AppProfilePage.jsx').then((m) => ({ default: m.AppProfilePage })))
const AppEarningsPage = lazy(() => import('../pages/app/AppEarningsPage.jsx').then((m) => ({ default: m.AppEarningsPage })))

const AppKycPage = lazy(() => import('../pages/app/AppKycPage.jsx').then((m) => ({ default: m.AppKycPage })))
const LabourNotificationsPage = lazy(() => import('../pages/app/labour/LabourNotificationsPage.jsx').then((m) => ({ default: m.LabourNotificationsPage })))
const IndividualBookingFlowPage = lazy(() => import('../pages/app/booking/IndividualBookingFlowPage.jsx').then((m) => ({ default: m.IndividualBookingFlowPage })))

const AppIndividualSearchPage = lazy(() => import('../pages/app/AppIndividualSearchPage.jsx').then((m) => ({ default: m.AppIndividualSearchPage })))
const ServiceCatalog = lazy(() => import('../pages/app/ServiceCatalog.jsx').then((m) => ({ default: m.ServiceCatalog })))
const Checkout = lazy(() => import('../pages/app/Checkout.jsx').then((m) => ({ default: m.Checkout })))
const JobTracking = lazy(() => import('../pages/app/JobTracking.jsx').then((m) => ({ default: m.JobTracking })))
const MyBookings = lazy(() => import('../pages/app/MyBookings.jsx').then((m) => ({ default: m.MyBookings })))
const ActiveJob = lazy(() => import('../pages/app/ActiveJob.jsx').then((m) => ({ default: m.ActiveJob })))
const LaborWallet = lazy(() => import('../pages/app/LaborWallet.jsx').then((m) => ({ default: m.LaborWallet })))
const AppSubCategoryServicePage = lazy(() => import('../pages/app/AppSubCategoryServicePage.jsx').then((m) => ({ default: m.AppSubCategoryServicePage })))
const AppSubscriptionPage = lazy(() => import('../pages/app/AppSubscriptionPage.jsx').then((m) => ({ default: m.AppSubscriptionPage })))
const AppPrivacyPolicyPage = lazy(() => import('../pages/app/AppPrivacyPolicyPage.jsx').then((m) => ({ default: m.AppPrivacyPolicyPage })))
const AppTermsConditionsPage = lazy(() => import('../pages/app/AppTermsConditionsPage.jsx').then((m) => ({ default: m.AppTermsConditionsPage })))
const AppFAQsPage = lazy(() => import('../pages/app/AppFAQsPage.jsx').then((m) => ({ default: m.AppFAQsPage })))
const AppCancellationPolicyPage = lazy(() => import('../pages/app/AppCancellationPolicyPage.jsx').then((m) => ({ default: m.AppCancellationPolicyPage })))
const AppRefundPolicyPage = lazy(() => import('../pages/app/AppRefundPolicyPage.jsx').then((m) => ({ default: m.AppRefundPolicyPage })))
const AppBillingPage = lazy(() => import('../pages/app/AppBillingPage.jsx').then((m) => ({ default: m.AppBillingPage })))
const AppReferralPage = lazy(() => import('../pages/app/AppReferralPage.jsx').then((m) => ({ default: m.AppReferralPage })))
import { USER_ROLES } from '../constants/userRoles.js'



export const appShellChildRoutes = (
  <>
    <Route index element={<AppHomePage />} />
    <Route path="discover/labours" element={<Navigate to="/app" replace />} />
    <Route
      path="booking/flow"
      
      element={
        <RoleRoute allow={[USER_ROLES.CUSTOMER, USER_ROLES.LABOUR, USER_ROLES.CONTRACTOR]} allowGuest>
          <IndividualBookingFlowPage />
        </RoleRoute>
      }
    />
    <Route
      path="bookings"
      element={
        <RoleRoute allow={[USER_ROLES.CUSTOMER, USER_ROLES.LABOUR, USER_ROLES.CONTRACTOR]}>
          <AppBookingsPage />
        </RoleRoute>
      }
    />
    <Route
      path="search"
      element={
        <RoleRoute allow={[USER_ROLES.CUSTOMER, USER_ROLES.CONTRACTOR]} allowGuest>
          <AppIndividualSearchPage />
        </RoleRoute>
      }
    />
    {/* New: Service Catalog */}
    <Route
      path="services"
      element={
        <RoleRoute allow={[USER_ROLES.CUSTOMER, USER_ROLES.CONTRACTOR]} allowGuest>
          <ServiceCatalog />
        </RoleRoute>
      }
    />
    {/* New: Sub Category Service Page */}
    <Route
      path="sub-category/:id"
      element={
        <RoleRoute allow={[USER_ROLES.CUSTOMER, USER_ROLES.CONTRACTOR]} allowGuest>
          <AppSubCategoryServicePage />
        </RoleRoute>
      }
    />
    {/* New: Checkout */}
    <Route
      path="checkout"
      element={
        <RoleRoute allow={[USER_ROLES.CUSTOMER, USER_ROLES.CONTRACTOR]} allowGuest>
          <Checkout />
        </RoleRoute>
      }
    />
    {/* New: Job Tracking */}
    <Route
      path="tracking/:bookingId"
      element={
        <RoleRoute allow={[USER_ROLES.CUSTOMER, USER_ROLES.CONTRACTOR]}>
          <JobTracking />
        </RoleRoute>
      }
    />
    <Route
      path="billing"
      element={
        <RoleRoute allow={[USER_ROLES.CUSTOMER, USER_ROLES.CONTRACTOR]}>
          <AppBillingPage />
        </RoleRoute>
      }
    />
    <Route
      path="subscriptions"
      element={
        <RoleRoute allow={[USER_ROLES.LABOUR]}>
          <AppSubscriptionPage />
        </RoleRoute>
      }
    />
    <Route
      path="subscription"
      element={
        <RoleRoute allow={[USER_ROLES.LABOUR]}>
          <AppSubscriptionPage />
        </RoleRoute>
      }
    />

    {/* New: My Bookings (API-backed) */}
    <Route
      path="my-bookings"
      element={
        <RoleRoute allow={[USER_ROLES.CUSTOMER, USER_ROLES.LABOUR, USER_ROLES.CONTRACTOR]}>
          <MyBookings />
        </RoleRoute>
      }
    />
    {/* New: Active Job (Labour) */}
    <Route
      path="active-job/:bookingId"
      element={
        <RoleRoute allow={[USER_ROLES.LABOUR]}>
          <ActiveJob />
        </RoleRoute>
      }
    />
    {/* New: Labor Wallet */}
    <Route
      path="wallet"
      element={
        <RoleRoute allow={[USER_ROLES.LABOUR]}>
          <LaborWallet />
        </RoleRoute>
      }
    />

    <Route
      path="jobs"
      element={
        <RoleRoute allow={[USER_ROLES.LABOUR]}>
          <AppJobsPage />
        </RoleRoute>
      }
    />
    <Route path="privacy-policy" element={<AppPrivacyPolicyPage />} />
    <Route path="terms-conditions" element={<AppTermsConditionsPage />} />
    <Route path="faqs" element={<AppFAQsPage />} />
    <Route path="cancellation-policy" element={<AppCancellationPolicyPage />} />
    <Route path="refund-policy" element={<AppRefundPolicyPage />} />
    <Route path="support" element={<AppSupportPage />} />
    <Route
      path="refer"
      element={
        <RoleRoute allow={[USER_ROLES.CUSTOMER, USER_ROLES.CONTRACTOR, USER_ROLES.LABOUR]}>
          <AppReferralPage />
        </RoleRoute>
      }
    />
    <Route path="profile" element={<AppProfilePage />} />
    <Route
      path="earnings"
      element={
        <RoleRoute allow={[USER_ROLES.LABOUR]}>
          <AppEarningsPage />
        </RoleRoute>
      }
    />
    <Route
      path="kyc"
      element={
        <RoleRoute allow={[USER_ROLES.LABOUR, USER_ROLES.CONTRACTOR]}>
          <AppKycPage />
        </RoleRoute>
      }
    />
    <Route
      path="notifications"
      element={
        <RoleRoute allow={[USER_ROLES.LABOUR]}>
          <LabourNotificationsPage />
        </RoleRoute>
      }
    />
  </>
)

