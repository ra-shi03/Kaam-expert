import { baseApi } from './baseApi.js'

function unwrap(response) {
  return response?.data ?? response
}

export const workforceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getContractorDashboard: build.query({
      query: () => '/contractor/dashboard',
      transformResponse: unwrap,
      providesTags: ['ContractorDashboard'],
    }),
    getContractorProjects: build.query({
      query: () => '/contractor/projects',
      transformResponse: unwrap,
      providesTags: ['Projects'],
    }),
    getContractorBanners: build.query({
      query: () => '/contractor/banners',
      transformResponse: unwrap,
      providesTags: ['Banners'],
    }),
    getContractorAnalytics: build.query({
      query: (params) => ({ url: '/contractor/analytics', params }),
      transformResponse: unwrap,
    }),

    getContractorTransactions: build.query({
      query: () => '/contractor/transactions',
      transformResponse: unwrap,
    }),
    listContractorVendors: build.query({
      query: () => '/contractor/vendors',
      transformResponse: unwrap,
      providesTags: ['Vendors'],
    }),
    createContractorProject: build.mutation({
      query: (body) => ({ url: '/contractor/projects', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Projects', 'ContractorDashboard'],
    }),
    getContractorProject: build.query({
      query: (id) => `/contractor/projects/${id}`,
      transformResponse: unwrap,
      providesTags: (_r, _e, id) => [{ type: 'Projects', id }],
    }),
    addContractorSite: build.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/contractor/projects/${projectId}/sites`,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Projects'],
    }),
    getMyRequests: build.query({
      query: (params) => ({ url: '/workforce/requests', params }),
      transformResponse: unwrap,
      providesTags: ['Requests'],
    }),
    getRequest: build.query({
      query: (id) => `/workforce/requests/${id}`,
      transformResponse: unwrap,
      providesTags: (_r, _e, id) => [{ type: 'Requests', id }],
    }),
    createRequest: build.mutation({
      query: (body) => ({ url: '/workforce/requests', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Requests', 'ContractorDashboard', 'AdminRequests'],
    }),
    mockPayRequest: build.mutation({
      query: (id) => ({ url: `/workforce/requests/${id}/mock-pay`, method: 'POST' }),
      transformResponse: unwrap,
      invalidatesTags: ['Requests', 'Invoices', 'ContractorDashboard', 'ContractorSubscription'],
    }),
    searchVendors: build.mutation({
      query: (body) => ({ url: '/contractor/vendors/search', method: 'POST', body }),
      transformResponse: unwrap,
    }),
    getContractorInvoices: build.query({
      query: () => '/contractor/invoices',
      transformResponse: unwrap,
      providesTags: ['Invoices'],
    }),
    patchContractorMe: build.mutation({
      query: (body) => ({ url: '/contractor/me', method: 'PATCH', body }),
      transformResponse: unwrap,
    }),
    addContractorDocument: build.mutation({
      query: (body) => ({ url: '/contractor/documents', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['ContractorProfile'],
    }),
    removeContractorDocument: build.mutation({
      query: (docId) => ({ url: `/contractor/documents/${docId}`, method: 'DELETE' }),
      transformResponse: unwrap,
    }),
    submitContractorVerification: build.mutation({
      query: () => ({ url: '/contractor/verification/submit', method: 'POST' }),
      transformResponse: unwrap,
      invalidatesTags: ['ContractorProfile', 'BusinessVerification'],
    }),
    createContractorComplaint: build.mutation({
      query: (body) => ({ url: '/contractor/complaints', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Complaints'],
    }),
    getContractorComplaints: build.query({
      query: () => '/contractor/complaints',
      transformResponse: unwrap,
      providesTags: ['Complaints'],
    }),
    rateContractorAssignment: build.mutation({
      query: ({ assignmentId, ...body }) => ({
        url: `/contractor/assignments/${assignmentId}/rate`,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
    }),
    initPayment: build.mutation({
      query: (body) => ({ url: '/payments/init', method: 'POST', body }),
      transformResponse: unwrap,
    }),
    verifyPayment: build.mutation({
      query: (body) => ({ url: '/payments/verify', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['ContractorSubscription', 'VendorSubscription', 'Invoices', 'Requests', 'ContractorDashboard'],
    }),
    getContractorSubscriptionPlans: build.query({
      query: () => '/contractor/subscription/plans',
      transformResponse: unwrap,
      providesTags: ['ContractorSubscription'],
    }),
    getContractorMySubscription: build.query({
      query: () => '/contractor/subscription/my-subscription',
      transformResponse: unwrap,
      providesTags: ['ContractorSubscription'],
    }),
    createContractorSubscriptionOrder: build.mutation({
      query: (body) => ({ url: '/contractor/subscription/order', method: 'POST', body }),
      transformResponse: unwrap,
    }),
    verifyContractorSubscriptionPayment: build.mutation({
      query: (body) => ({ url: '/contractor/subscription/verify', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['ContractorSubscription'],
    }),
    getVendorDashboard: build.query({
      query: () => '/vendor/dashboard',
      transformResponse: unwrap,
      providesTags: ['VendorDashboard'],
    }),
    getVendorCrew: build.query({
      query: () => '/vendor/crew',
      transformResponse: unwrap,
      providesTags: ['Crew'],
    }),
    linkVendorCrew: build.mutation({
      query: (body) => ({ url: '/vendor/crew/link', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Crew', 'VendorDashboard'],
    }),
    getVendorJobs: build.query({
      query: () => '/vendor/jobs',
      transformResponse: unwrap,
      providesTags: ['VendorJobs'],
    }),

    acceptVendorJob: build.mutation({
      query: (requestId) => ({ url: `/vendor/jobs/${requestId}/accept`, method: 'POST' }),
      transformResponse: unwrap,
      invalidatesTags: ['VendorJobs', 'VendorDashboard', 'Crew'],
    }),
    getVendorDirectRequests: build.query({
      query: () => '/vendor/direct-requests',
      transformResponse: unwrap,
      providesTags: ['VendorDirectRequests'],
    }),
    getVendorSettlements: build.query({
      query: () => '/vendor/settlements',
      transformResponse: unwrap,
      providesTags: ['Invoices'],
    }),
    patchVendorMe: build.mutation({
      query: (body) => ({ url: '/vendor/me', method: 'PATCH', body }),
      transformResponse: unwrap,
      invalidatesTags: ['VendorProfile'],
    }),
    addVendorDocument: build.mutation({
      query: (body) => ({ url: '/vendor/documents', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['VendorProfile'],
    }),
    removeVendorDocument: build.mutation({
      query: (docId) => ({ url: `/vendor/documents/${docId}`, method: 'DELETE' }),
      transformResponse: unwrap,
    }),
    submitVendorVerification: build.mutation({
      query: () => ({ url: '/vendor/verification/submit', method: 'POST' }),
      transformResponse: unwrap,
      invalidatesTags: ['VendorProfile', 'BusinessVerification'],
    }),
    getLabourAssignments: build.query({
      query: (params) => ({ url: '/workforce/assignments', params }),
      transformResponse: unwrap,
      providesTags: ['Assignments'],
    }),
    respondAssignment: build.mutation({
      query: ({ id, action }) => ({
        url: `/workforce/assignments/${id}/respond`,
        method: 'PATCH',
        body: { action },
      }),
      transformResponse: unwrap,
      invalidatesTags: ['Assignments'],
    }),

    getAdminRequests: build.query({
      query: (params) => ({ url: '/admin/workforce/requests', params }),
      transformResponse: unwrap,
      providesTags: (result) =>
        result
          ? [
              ...result.requests.map(({ _id }) => ({ type: 'AdminRequests', id: _id })),
              { type: 'AdminRequests', id: 'LIST' },
            ]
          : [{ type: 'AdminRequests', id: 'LIST' }],
    }),
    getAdminRequestById: build.query({
      query: (id) => ({ url: `/admin/workforce/requests/${id}` }),
      transformResponse: unwrap,
      providesTags: (_r, _e, id) => [{ type: 'AdminRequests', id }],
    }),
    patchRequestStatus: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/workforce/requests/${id}/status`,
        method: 'PATCH',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: ['AdminRequests', 'Requests'],
    }),
    deleteAdminRequest: build.mutation({
      query: (id) => ({
        url: `/admin/workforce/requests/${id}`,
        method: 'DELETE',
      }),
      transformResponse: unwrap,
      invalidatesTags: ['AdminRequests', 'Requests'],
    }),
    createAllocation: build.mutation({
      query: (body) => ({ url: '/admin/workforce/allocations', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['AdminRequests', 'Assignments', 'VendorJobs'],
    }),
    listContractorVerifications: build.query({
      query: (params) => ({ url: '/admin/workforce/contractors', params }),
      transformResponse: unwrap,
      providesTags: ['BusinessVerification'],
    }),
    listVendorVerifications: build.query({
      query: (params) => ({ url: '/admin/workforce/vendors', params }),
      transformResponse: unwrap,
      providesTags: ['BusinessVerification'],
    }),
    getContractorVerificationDetail: build.query({
      query: (id) => `/admin/workforce/contractors/${id}`,
      transformResponse: unwrap,
    }),
    getVendorVerificationDetail: build.query({
      query: (id) => `/admin/workforce/vendors/${id}`,
      transformResponse: unwrap,
    }),
    reviewContractor: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/workforce/contractors/${id}/review`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['ContractorProfile', 'BusinessVerification'],
    }),
    reviewVendor: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/workforce/vendors/${id}/review`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['VendorProfile', 'BusinessVerification'],
    }),
    generateInvoice: build.mutation({
      query: (body) => ({ url: '/admin/workforce/invoices/generate', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['Invoices', 'AdminRequests'],
    }),
    getAdminPricing: build.query({
      query: () => '/admin/workforce/pricing',
      transformResponse: unwrap,
      providesTags: ['AdminPricing'],
    }),
    upsertPricing: build.mutation({
      query: (body) => ({ url: '/admin/workforce/pricing', method: 'POST', body }),
      transformResponse: unwrap,
      invalidatesTags: ['AdminPricing'],
    }),

  }),
})

export const {
  useGetContractorDashboardQuery,
  useGetContractorBannersQuery,
  useGetContractorAnalyticsQuery,

  useGetContractorTransactionsQuery,
  useCreateContractorComplaintMutation,
  useGetContractorComplaintsQuery,
  useRateContractorAssignmentMutation,
  useInitPaymentMutation,
  useVerifyPaymentMutation,
  useGetContractorProjectsQuery,
  useCreateContractorProjectMutation,
  useGetContractorProjectQuery,
  useAddContractorSiteMutation,
  useGetContractorSubscriptionPlansQuery,
  useGetContractorMySubscriptionQuery,
  useCreateContractorSubscriptionOrderMutation,
  useVerifyContractorSubscriptionPaymentMutation,
  useGetMyRequestsQuery,
  useGetRequestQuery,
  useCreateRequestMutation,
  useMockPayRequestMutation,
  useSearchVendorsMutation,
  useGetContractorInvoicesQuery,
  usePatchContractorMeMutation,
  useAddContractorDocumentMutation,
  useRemoveContractorDocumentMutation,
  useSubmitContractorVerificationMutation,
  useGetVendorDashboardQuery,
  useGetVendorCrewQuery,
  useLinkVendorCrewMutation,
  useGetVendorJobsQuery,

  useAcceptVendorJobMutation,
  useGetVendorSettlementsQuery,
  usePatchVendorMeMutation,
  useAddVendorDocumentMutation,
  useRemoveVendorDocumentMutation,
  useSubmitVendorVerificationMutation,
  useListContractorVerificationsQuery,
  useListVendorVerificationsQuery,
  useLazyGetContractorVerificationDetailQuery,
  useLazyGetVendorVerificationDetailQuery,
  useGetLabourAssignmentsQuery,
  useRespondAssignmentMutation,

  useGetAdminRequestsQuery,
  useGetAdminRequestByIdQuery,
  usePatchRequestStatusMutation,
  useDeleteAdminRequestMutation,
  useCreateAllocationMutation,
  useReviewContractorMutation,
  useReviewVendorMutation,
  useGenerateInvoiceMutation,
  useGetAdminPricingQuery,
  useUpsertPricingMutation,

} = workforceApi
