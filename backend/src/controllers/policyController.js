import Policy from '../models/Policy.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess, sendError, HTTP_STATUS } from '../utils/apiResponse.js'

// Get policy by type and role
export const getPolicy = asyncHandler(async (req, res) => {
  const { type, role } = req.params

  if (!type || !role) {
    return sendError(res, {
      message: 'Please provide both policy type and role',
      statusCode: HTTP_STATUS.BAD_REQUEST,
    })
  }

  let policy = await Policy.findOne({ type, role })

  if (!policy) {
    // Return empty policy if not found
    policy = {
      type,
      role,
      content: ''
    }
  }

  return sendSuccess(res, {
    data: policy,
  })
})

// Update or create policy
export const updatePolicy = asyncHandler(async (req, res) => {
  const { type, role } = req.params
  const { content } = req.body

  if (!type || !role) {
    return sendError(res, {
      message: 'Please provide both policy type and role',
      statusCode: HTTP_STATUS.BAD_REQUEST,
    })
  }

  const policy = await Policy.findOneAndUpdate(
    { type, role },
    { content },
    {
      new: true,
      upsert: true, // Create if it doesn't exist
      runValidators: true,
    }
  )

  return sendSuccess(res, {
    data: policy,
  })
})
