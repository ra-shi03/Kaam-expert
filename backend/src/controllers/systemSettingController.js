import { SystemSetting } from '../models/SystemSetting.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HTTP_STATUS, sendError, sendSuccess } from '../utils/apiResponse.js'
import { uploadBufferToCloudinary } from '../services/cloudinaryService.js'

export const getSystemSettings = asyncHandler(async (req, res) => {
  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) {
    settings = await SystemSetting.create({ configKey: 'master_config' })
  }
  return sendSuccess(res, { data: { settings } })
})

export const updatePlatformFees = asyncHandler(async (req, res) => {
  const { type, value, isActive } = req.body
  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = new SystemSetting({ configKey: 'master_config' })
  
  const targetObj = settings.platformFee
  
  if (type) targetObj.type = type
  if (value !== undefined) targetObj.value = Number(value)
  if (isActive !== undefined) targetObj.isActive = Boolean(isActive)
  
  await settings.save()
  return sendSuccess(res, { message: 'Platform fees updated', data: { settings } })
})

export const updateCommission = asyncHandler(async (req, res) => {
  const { type, globalPercentage, isActive, bookingType = 'B2C' } = req.body
  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = new SystemSetting({ configKey: 'master_config' })
  
  const targetObj = settings.commission
  
  if (type) targetObj.type = type
  if (globalPercentage !== undefined) targetObj.globalPercentage = Number(globalPercentage)
  if (isActive !== undefined) targetObj.isActive = Boolean(isActive)
  
  await settings.save()
  return sendSuccess(res, { message: 'Commission updated', data: { settings } })
})

export const updateLabourCashLimit = asyncHandler(async (req, res) => {
  const { labourCashLimit } = req.body
  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = new SystemSetting({ configKey: 'master_config' })
  
  if (labourCashLimit !== undefined) settings.labourCashLimit = Number(labourCashLimit)
  
  await settings.save()
  return sendSuccess(res, { message: 'Labour cash limit updated', data: { settings } })
})



export const updateGstPercentage = asyncHandler(async (req, res) => {
  const { gstPercentage } = req.body
  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = new SystemSetting({ configKey: 'master_config' })
  
  if (gstPercentage !== undefined) settings.gstPercentage = Number(gstPercentage)
  
  await settings.save()
  return sendSuccess(res, { message: 'GST percentage updated', data: { settings } })
})

export const updateCancellationPenalty = asyncHandler(async (req, res) => {
  const { cancellationPenalty } = req.body
  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = new SystemSetting({ configKey: 'master_config' })
  
  if (cancellationPenalty !== undefined) settings.cancellationPenalty = Number(cancellationPenalty)
  
  await settings.save()
  return sendSuccess(res, { message: 'Cancellation penalty updated', data: { settings } })
})

export const updateTimeSlots = asyncHandler(async (req, res) => {
  const { timeSlots } = req.body
  if (!Array.isArray(timeSlots)) {
    return sendError(res, { message: 'timeSlots must be an array', statusCode: HTTP_STATUS.BAD_REQUEST })
  }
  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = new SystemSetting({ configKey: 'master_config' })
  
  settings.timeSlots = timeSlots
  await settings.save()
  return sendSuccess(res, { message: 'Time slots updated', data: { settings } })
})

export const updateUserSubscriptionToggle = asyncHandler(async (req, res) => {
  const { isUserSubscriptionEnabled } = req.body
  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = new SystemSetting({ configKey: 'master_config' })
  
  if (isUserSubscriptionEnabled !== undefined) {
    settings.isUserSubscriptionEnabled = Boolean(isUserSubscriptionEnabled)
  }
  
  await settings.save()
  return sendSuccess(res, { message: 'User subscription toggle updated', data: { settings } })
})

export const updateDynamicSubscriptionSettings = asyncHandler(async (req, res) => {
  const { dailySubscriptionPrice, freeTrialDays, freeTrialMessage, subscriptionStartHour, subscriptionEndHour } = req.body
  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = new SystemSetting({ configKey: 'master_config' })

  if (dailySubscriptionPrice !== undefined) settings.dailySubscriptionPrice = Number(dailySubscriptionPrice)
  if (freeTrialDays !== undefined) settings.freeTrialDays = Number(freeTrialDays)
  if (freeTrialMessage !== undefined) settings.freeTrialMessage = String(freeTrialMessage)
  if (subscriptionStartHour !== undefined) settings.subscriptionStartHour = Number(subscriptionStartHour)
  if (subscriptionEndHour !== undefined) settings.subscriptionEndHour = Number(subscriptionEndHour)

  await settings.save()
  return sendSuccess(res, { message: 'Dynamic subscription settings updated', data: { settings } })
})

export const updateMaxHourDiscount = asyncHandler(async (req, res) => {
  const { maxHourDiscountPercentage } = req.body
  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = new SystemSetting({ configKey: 'master_config' })

  if (maxHourDiscountPercentage !== undefined) settings.maxHourDiscountPercentage = Number(maxHourDiscountPercentage)

  await settings.save()
  return sendSuccess(res, { message: 'Max-hour discount updated', data: { settings } })
})

export const updatePaymentModes = asyncHandler(async (req, res) => {
  const { cashEnabled, onlineEnabled } = req.body
  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = new SystemSetting({ configKey: 'master_config' })

  if (!settings.paymentModes) {
    settings.paymentModes = { cashEnabled: true, onlineEnabled: true }
  }

  if (cashEnabled !== undefined) settings.paymentModes.cashEnabled = Boolean(cashEnabled)
  if (onlineEnabled !== undefined) settings.paymentModes.onlineEnabled = Boolean(onlineEnabled)

  await settings.save()
  return sendSuccess(res, { message: 'Payment modes updated', data: { settings } })
})

export const uploadBranding = asyncHandler(async (req, res) => {
  const { type } = req.body // 'logo' or 'favicon'
  if (!['logo', 'favicon'].includes(type)) {
    return sendError(res, { message: 'Invalid branding type. Must be logo or favicon.', statusCode: HTTP_STATUS.BAD_REQUEST })
  }

  if (!req.file) {
    return sendError(res, { message: 'No file uploaded', statusCode: HTTP_STATUS.BAD_REQUEST })
  }

  const uploadResult = await uploadBufferToCloudinary({
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    folder: `kaamexpert/branding/${type}`,
    userId: req.user?._id,
    originalName: req.file.originalname,
  })

  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = new SystemSetting({ configKey: 'master_config' })

  if (!settings.branding) {
    settings.branding = { logoUrl: null, faviconUrl: null }
  }

  if (type === 'logo') {
    settings.branding.logoUrl = uploadResult.url
  } else {
    settings.branding.faviconUrl = uploadResult.url
  }

  await settings.save()

  return sendSuccess(res, { message: `${type} uploaded successfully`, data: { branding: settings.branding } })
})

export const deleteBranding = asyncHandler(async (req, res) => {
  const { type } = req.params
  if (!['logo', 'favicon'].includes(type)) {
    return sendError(res, { message: 'Invalid branding type. Must be logo or favicon.', statusCode: HTTP_STATUS.BAD_REQUEST })
  }

  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = new SystemSetting({ configKey: 'master_config' })

  if (!settings.branding) {
    settings.branding = { logoUrl: null, faviconUrl: null }
  }

  if (type === 'logo') {
    settings.branding.logoUrl = null
  } else {
    settings.branding.faviconUrl = null
  }

  await settings.save()

  return sendSuccess(res, { message: `${type} deleted successfully`, data: { branding: settings.branding } })
})

// ─── Duration Options ──────────────────────────────────────────────────────────

/**
 * GET  /admin/settings/duration-options
 * Returns the full durationOptions list sorted by minutes.
 */
export const getDurationOptions = asyncHandler(async (req, res) => {
  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = await SystemSetting.create({ configKey: 'master_config' })
  const sorted = [...(settings.durationOptions || [])].sort((a, b) => a.minutes - b.minutes)
  return sendSuccess(res, {
    data: {
      workingHoursPerDay: settings.workingHoursPerDay || 8,
      durationOptions: sorted,
    },
  })
})

/**
 * PATCH /admin/settings/duration-options/:minutes/toggle
 * Toggles isActive for one slot.
 */
export const toggleDurationOption = asyncHandler(async (req, res) => {
  const targetMinutes = parseInt(req.params.minutes)
  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = await SystemSetting.create({ configKey: 'master_config' })

  const opt = (settings.durationOptions || []).find((d) => d.minutes === targetMinutes)
  if (!opt) {
    return sendError(res, { message: 'Duration option not found', statusCode: HTTP_STATUS.NOT_FOUND })
  }
  opt.isActive = !opt.isActive
  settings.markModified('durationOptions')
  await settings.save()
  return sendSuccess(res, {
    message: `${opt.label} is now ${opt.isActive ? 'enabled' : 'disabled'}`,
    data: { option: opt, durationOptions: settings.durationOptions },
  })
})

/**
 * PATCH /admin/settings/working-hours
 * Updates workingHoursPerDay. Pre-save hook auto-recomputes Half Day / Full Day minutes.
 */
export const updateWorkingHours = asyncHandler(async (req, res) => {
  const { workingHoursPerDay } = req.body
  if (!workingHoursPerDay || isNaN(workingHoursPerDay)) {
    return sendError(res, { message: 'workingHoursPerDay must be a number', statusCode: HTTP_STATUS.BAD_REQUEST })
  }
  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = new SystemSetting({ configKey: 'master_config' })

  settings.workingHoursPerDay = Number(workingHoursPerDay)
  settings.markModified('workingHoursPerDay')
  await settings.save()

  const halfHrs = settings.workingHoursPerDay / 2
  return sendSuccess(res, {
    message: `Working hours updated to ${settings.workingHoursPerDay} hrs/day. Half Day = ${halfHrs} hrs, Full Day = ${settings.workingHoursPerDay} hrs.`,
    data: { workingHoursPerDay: settings.workingHoursPerDay, durationOptions: settings.durationOptions },
  })
})

/**
 * POST /admin/settings/duration-options
 * Adds a new custom duration slot.
 */
export const addDurationOption = asyncHandler(async (req, res) => {
  const { minutes, label, tag } = req.body
  const numMinutes = parseInt(minutes, 10)

  if (!numMinutes || isNaN(numMinutes) || numMinutes <= 0 || numMinutes > 1440) {
    return sendError(res, { message: 'Duration minutes must be between 1 and 1440 (24 hrs)', statusCode: HTTP_STATUS.BAD_REQUEST })
  }

  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = await SystemSetting.create({ configKey: 'master_config' })

  const existing = (settings.durationOptions || []).find((d) => d.minutes === numMinutes)
  if (existing) {
    return sendError(res, { message: `A duration option with ${numMinutes} minutes already exists (${existing.label})`, statusCode: HTTP_STATUS.CONFLICT })
  }

  // Format default label if none provided
  let formattedLabel = (label && label.trim()) || ''
  if (!formattedLabel) {
    const hrs = Math.floor(numMinutes / 60)
    const mins = numMinutes % 60
    if (hrs > 0 && mins > 0) {
      formattedLabel = `${hrs} hr ${mins} min`
    } else if (hrs > 0) {
      formattedLabel = `${hrs} ${hrs === 1 ? 'hr' : 'hrs'}`
    } else {
      formattedLabel = `${mins} min`
    }
  }

  const determinedTag = tag || (numMinutes < 60 ? 'quick' : 'hourly')

  const newOption = {
    minutes: numMinutes,
    label: formattedLabel,
    tag: determinedTag,
    isActive: true,
  }

  settings.durationOptions.push(newOption)
  settings.durationOptions.sort((a, b) => a.minutes - b.minutes)
  settings.markModified('durationOptions')
  await settings.save()

  return sendSuccess(res, {
    message: `Added new duration slot: ${formattedLabel}`,
    statusCode: HTTP_STATUS.CREATED,
    data: {
      option: newOption,
      durationOptions: settings.durationOptions,
    },
  })
})

/**
 * DELETE /admin/settings/duration-options/:minutes
 * Deletes a custom duration slot (Half Day and Full Day are protected).
 */
export const deleteDurationOption = asyncHandler(async (req, res) => {
  const targetMinutes = parseInt(req.params.minutes, 10)
  let settings = await SystemSetting.findOne({ configKey: 'master_config' })
  if (!settings) settings = await SystemSetting.create({ configKey: 'master_config' })

  const opt = (settings.durationOptions || []).find((d) => d.minutes === targetMinutes)
  if (!opt) {
    return sendError(res, { message: 'Duration option not found', statusCode: HTTP_STATUS.NOT_FOUND })
  }

  if (opt.tag === 'half_day' || opt.tag === 'full_day') {
    return sendError(res, { message: 'Half Day and Full Day are linked to system working hours and cannot be deleted.', statusCode: HTTP_STATUS.BAD_REQUEST })
  }

  settings.durationOptions = settings.durationOptions.filter((d) => d.minutes !== targetMinutes)
  settings.markModified('durationOptions')
  await settings.save()

  return sendSuccess(res, {
    message: `Duration slot ${opt.label} deleted successfully`,
    data: { durationOptions: settings.durationOptions },
  })
})
