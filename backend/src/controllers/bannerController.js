import { Banner } from '../models/Banner.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendSuccess } from '../utils/apiResponse.js'

export const getActiveBanners = asyncHandler(async (req, res) => {
  const { panel } = req.query
  const filter = { isActive: true }
  if (panel) {
    filter.panel = panel
  } else {
    filter.$or = [{ panel: 'APP' }, { panel: { $exists: false } }]
  }
  const banners = await Banner.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean()
  return sendSuccess(res, { data: { banners } })
})
