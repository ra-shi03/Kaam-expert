import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { GlassPanel } from '../../components/ui/GlassPanel.jsx'
import { LabourAttendanceHero } from '../../components/labour/attendance/LabourAttendanceHero.jsx'
import { LabourAttendanceTodayPanel } from '../../components/labour/attendance/LabourAttendanceTodayPanel.jsx'
import { LabourAttendanceDailyView } from '../../components/labour/attendance/LabourAttendanceDailyView.jsx'
import { LabourAttendanceProjectView } from '../../components/labour/attendance/LabourAttendanceProjectView.jsx'
import { LabourAttendanceWorkView } from '../../components/labour/attendance/LabourAttendanceWorkView.jsx'
import {
  appendAttendancePunch,
  dayKey,
  lastTodayType,
  liveWorkedSecondsForDay,
  readAttendanceEntries,
  subscribeAttendance,
} from '../../lib/labourAttendanceStorage.js'
import {
  buildDailyAttendanceRows,
  buildProjectAttendanceBundles,
  buildWeekAttendanceSummary,
  buildWorkAttendanceGroups,
  defaultLabelsFromActiveJob,
  formatDayLabel,
  formatTime,
  projectOptionsFromJobs,
  workOptionsFromJobs,
} from '../../lib/labourAttendanceAnalytics.js'
import { loadJobDemoState, subscribeJobDemo } from '../../lib/labourJobDemoStorage.js'
import { seedSampleEarningsDemo } from '../../lib/labourEarningsDemoSeed.js'
import { useNow } from '../../hooks/useNow.js'
import { AppPrimaryButton } from '../../components/app/AppPrimaryButton.jsx'
import { Sparkles } from 'lucide-react'

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'daily', label: 'Daily' },
  { id: 'projects', label: 'Projects' },
  { id: 'work', label: 'By work' },
]

export function AppAttendancePage() {
  const reduce = useReducedMotion()
  const now = useNow(1000)
  const [tab, setTab] = useState('today')
  const [entries, setEntries] = useState(readAttendanceEntries)
  const [jobState, setJobState] = useState(loadJobDemoState)
  const [projectLabel, setProjectLabel] = useState('')
  const [workLabel, setWorkLabel] = useState('')
  const [toast, setToast] = useState('')
  const [labelsReady, setLabelsReady] = useState(false)

  useEffect(() => subscribeAttendance(setEntries), [])
  useEffect(() => subscribeJobDemo(() => setJobState(loadJobDemoState())), [])

  useEffect(() => {
    if (labelsReady) return
    const { projectLabel: p, workLabel: w } = defaultLabelsFromActiveJob(jobState)
    if (p) setProjectLabel(p)
    if (w) setWorkLabel(w)
    setLabelsReady(true)
  }, [jobState, labelsReady])

  const todayKey = dayKey()
  const lastType = lastTodayType(entries)
  const onSite = lastType === 'in'
  const workedSecondsToday = useMemo(
    () => liveWorkedSecondsForDay(entries, todayKey, now),
    [entries, todayKey, now],
  )

  const weekSummary = useMemo(() => buildWeekAttendanceSummary(entries), [entries])
  const dailyRows = useMemo(() => buildDailyAttendanceRows(entries, 14), [entries])
  const projectBundles = useMemo(() => buildProjectAttendanceBundles(entries, jobState), [entries, jobState])
  const workGroups = useMemo(() => buildWorkAttendanceGroups(entries, 14), [entries])
  const projectOptions = useMemo(() => projectOptionsFromJobs(jobState, entries), [jobState, entries])
  const workOptions = useMemo(() => workOptionsFromJobs(jobState, entries), [jobState, entries])

  const todayPunches = useMemo(() => {
    return entries
      .filter((e) => e.day === todayKey)
      .sort((a, b) => new Date(a.at) - new Date(b.at))
      .map((e) => ({ ...e, time: formatTime(e.at) }))
  }, [entries, todayKey])

  const activeProjectTitle = jobState?.active?.[0]?.title || jobState?.active?.[0]?.site || null

  const showToast = useCallback((msg) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2400)
  }, [])

  const punchLabels = () => ({
    projectLabel: projectLabel || 'Unassigned',
    workLabel: workLabel || 'Unassigned',
  })

  const handleTapIn = () => {
    if (lastType === 'in') {
      showToast('Already checked in.')
      return
    }
    if (!projectLabel?.trim()) {
      showToast('Select a project / site first.')
      return
    }
    appendAttendancePunch('in', punchLabels())
    setEntries(readAttendanceEntries())
    showToast('Checked in — time is recording.')
  }

  const handleTapOut = () => {
    if (lastType !== 'in') {
      showToast('Check in first.')
      return
    }
    appendAttendancePunch('out', punchLabels())
    setEntries(readAttendanceEntries())
    showToast('Checked out — shift saved.')
  }

  return (
    <div className="space-y-4 pb-8">
      <AnimatePresence>
        {toast ? (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0 }}
            className="fixed left-4 right-4 top-[max(4.5rem,env(safe-area-inset-top))] z-[120] mx-auto max-w-md rounded-2xl border border-sky-300/40 bg-sky-900/95 px-4 py-3 text-center text-sm font-semibold text-white shadow-xl"
            role="status"
          >
            {toast}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <LabourAttendanceHero
        onSite={onSite}
        workedSecondsToday={workedSecondsToday}
        weekPresentDays={weekSummary.presentDays}
        weekTotalMinutes={weekSummary.totalMinutes}
        activeProjectTitle={activeProjectTitle}
      />

      <GlassPanel className="border-slate-200/90 p-1.5">
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100/90 p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg py-2 text-[10px] font-bold leading-tight sm:text-xs ${
                tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </GlassPanel>

      {tab === 'today' ? (
        <LabourAttendanceTodayPanel
          onSite={onSite}
          workedSecondsToday={workedSecondsToday}
          todayLabel={formatDayLabel(todayKey)}
          projectLabel={projectLabel}
          workLabel={workLabel}
          projectOptions={projectOptions}
          workOptions={workOptions}
          onProjectChange={setProjectLabel}
          onWorkChange={setWorkLabel}
          onTapIn={handleTapIn}
          onTapOut={handleTapOut}
          todayPunches={todayPunches}
          canTapIn={lastType !== 'in'}
          canTapOut={lastType === 'in'}
        />
      ) : null}

      {tab === 'daily' ? <LabourAttendanceDailyView rows={dailyRows} /> : null}
      {tab === 'projects' ? <LabourAttendanceProjectView bundles={projectBundles} /> : null}
      {tab === 'work' ? <LabourAttendanceWorkView groups={workGroups} /> : null}

      {entries.length === 0 ? (
        <GlassPanel className="border-dashed border-slate-200/90 bg-slate-50/60 p-4 text-center">
          <p className="text-xs text-slate-600">Need demo data? Load sample attendance from past shifts.</p>
          <AppPrimaryButton
            type="button"
            className="mt-3 w-full py-2.5 text-xs"
            onClick={() => {
              seedSampleEarningsDemo({ force: true })
              setEntries(readAttendanceEntries())
              showToast('Sample attendance loaded — check Daily & Projects tabs.')
            }}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Load sample attendance
          </AppPrimaryButton>
        </GlassPanel>
      ) : null}
    </div>
  )
}
