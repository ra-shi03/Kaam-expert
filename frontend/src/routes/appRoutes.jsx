import { Navigate, Route } from 'react-router-dom'
import { RoleRoute } from '../components/auth/RoleRoute.jsx'
import { AppHomePage } from '../pages/app/AppHomePage.jsx'
import { AppBookingsPage } from '../pages/app/AppBookingsPage.jsx'
import { AppJobsPage } from '../pages/app/AppJobsPage.jsx'
import { AppSupportPage } from '../pages/app/AppSupportPage.jsx'
import { AppProfilePage } from '../pages/app/AppProfilePage.jsx'
import { AppEarningsPage } from '../pages/app/AppEarningsPage.jsx'

import { AppKycPage } from '../pages/app/AppKycPage.jsx'
import { LabourNotificationsPage } from '../pages/app/labour/LabourNotificationsPage.jsx'
import { IndividualBookingFlowPage } from '../pages/app/booking/IndividualBookingFlowPage.jsx'

import { AppIndividualSearchPage } from '../pages/app/AppIndividualSearchPage.jsx'
import { ServiceCatalog } from '../pages/app/ServiceCatalog.jsx'
import { Checkout } from '../pages/app/Checkout.jsx'
import { JobTracking } from '../pages/app/JobTracking.jsx'
import { MyBookings } from '../pages/app/MyBookings.jsx'
import { ActiveJob } from '../pages/app/ActiveJob.jsx'
import { LaborWallet } from '../pages/app/LaborWallet.jsx'
import { AppSubCategoryServicePage } from '../pages/app/AppSubCategoryServicePage.jsx'
import { AppSubscriptionPage } from '../pages/app/AppSubscriptionPage.jsx'
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
    <Route path="support" element={<AppSupportPage />} />
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

