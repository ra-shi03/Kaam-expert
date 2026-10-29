import Policy from '../models/Policy.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess, sendError, HTTP_STATUS } from '../utils/apiResponse.js'
import { getDefaultPolicyContent } from '../constants/policyDefaults.js'

const POLICY_TYPES = Policy.schema.path('type').enumValues
const POLICY_ROLES = Policy.schema.path('role').enumValues

function invalidParams(res, type, role) {
  if (POLICY_TYPES.includes(type) && POLICY_ROLES.includes(role)) return false
  sendError(res, { message: 'Unknown policy type or role', statusCode: HTTP_STATUS.BAD_REQUEST })
  return true
}

// Get policy by type and role. Falls back to the built-in default text until an admin saves their own.
export const getPolicy = asyncHandler(async (req, res) => {
  const { type, role } = req.params
  if (invalidParams(res, type, role)) return

  const policy = await Policy.findOne({ type, role })
  const defaultContent = getDefaultPolicyContent(type, role)
  const saved = policy?.content?.trim()

  return sendSuccess(res, {
    data: {
      type,
      role,
      content: saved ? policy.content : defaultContent,
      defaultContent,
      isDefault: !saved,
      updatedAt: saved ? policy.updatedAt : null,
    },
  })
})

// Update or create policy
export const updatePolicy = asyncHandler(async (req, res) => {
  const { type, role } = req.params
  if (invalidParams(res, type, role)) return

  const policy = await Policy.findOneAndUpdate(
    { type, role },
    { content: String(req.body.content ?? '') },
    { new: true, upsert: true, runValidators: true },
  )

  return sendSuccess(res, { data: policy })
})
