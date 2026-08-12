/** Contractor KYC document types — keep in sync with frontend */
export const CONTRACTOR_DOCUMENT_TYPES = {
  COMPANY_REGISTRATION: 'company_registration',
  GST_CERTIFICATE: 'gst_certificate',
  PAN_CARD: 'pan_card',
  CIN_CERTIFICATE: 'cin_certificate',
  AUTHORIZED_SIGNATORY_ID: 'authorized_signatory_id',
  CANCELLED_CHEQUE: 'cancelled_cheque',
  OTHER: 'other',
}

export const CONTRACTOR_DOCUMENT_TYPE_LIST = Object.values(CONTRACTOR_DOCUMENT_TYPES)

export const CONTRACTOR_DOCUMENT_LABELS = {
  [CONTRACTOR_DOCUMENT_TYPES.COMPANY_REGISTRATION]: 'Company registration / COI',
  [CONTRACTOR_DOCUMENT_TYPES.GST_CERTIFICATE]: 'GST registration certificate',
  [CONTRACTOR_DOCUMENT_TYPES.PAN_CARD]: 'Company PAN card',
  [CONTRACTOR_DOCUMENT_TYPES.CIN_CERTIFICATE]: 'CIN / LLPIN certificate',
  [CONTRACTOR_DOCUMENT_TYPES.AUTHORIZED_SIGNATORY_ID]: 'Authorized signatory ID',
  [CONTRACTOR_DOCUMENT_TYPES.CANCELLED_CHEQUE]: 'Cancelled cheque / bank proof',
  [CONTRACTOR_DOCUMENT_TYPES.OTHER]: 'Other supporting document',
}
