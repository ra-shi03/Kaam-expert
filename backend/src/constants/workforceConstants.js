export const REQUEST_SOURCE = {
  INDIVIDUAL: 'customer',
  CONTRACTOR: 'contractor',
}

export const REQUEST_STATUS = {
  PENDING_REVIEW: 'pending_review',
  BROADCASTED: 'broadcasted',
  CONFIRMED: 'confirmed',
  ALLOCATING: 'allocating',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  BILLING: 'billing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
}


export const ASSIGNMENT_STATUS = {
  OFFERED: 'offered',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  ON_SITE: 'on_site',
  COMPLETED: 'completed',
  REPLACED: 'replaced',
}



export const PROJECT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
}

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
}

export const BILLING_MODE = {
  PREPAID: 'prepaid',
  POSTPAID: 'postpaid',
  MILESTONE: 'milestone',
}
