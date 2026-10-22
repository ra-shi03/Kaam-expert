import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { userTypes } from '../../data/landingContent'
import { LandingIcon } from '../../lib/iconMap'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { SectionHeading } from '../ui/SectionHeading'
import { writeBootRole } from '../../lib/bootPersona.js'
import { USER_ROLES } from '../../constants/userRoles.js'

export function UserTypesSection() {
  const navigate = useNavigate()

  function handleRoleAction(role) {
    if (role === 'contractor') {
      writeBootRole(USER_ROLES.CONTRACTOR)
      navigate('/app')
      return
    }
    if (role === 'labour') {
      navigate('/labours/auth')
      return
    }
    // Default: customer
    writeBootRole(USER_ROLES.CUSTOMER)
    navigate('/app')
  }

  const roleButtonLabels = {
    customer: 'Book as Customer',
    contractor: 'Contractor Portal',
    labour: 'Partner as Labour',
  }

  return (
    <section
      id="roles"
      className="border-y border-slate-200/80 bg-slate-50/70 py-20 md:py-28 text-slate-900"
      aria-labelledby="users-heading"
    >
      <Container>
        <SectionHeading
          titleId="users-heading"
          eyebrow="Role-Based Ecosystem"
          title="Tailored for Customers, Contractors & Labour Partners"
          subtitle="KaamExpert is built specifically for Customers, Contractors, and Labour Partners with dedicated interfaces, transparent pricing, and instant settlements."
          align="center"
        />

        <div className="mt-10 grid gap-4 sm:mt-12 sm:gap-6 md:grid-cols-3">
          {userTypes.map((u, i) => (
            <Reveal key={u.title} delay={i * 0.08}>
              <article
                className="lp-hover-t group flex h-full flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm hover:-translate-y-2 hover:border-brand/40 hover:shadow-[0_28px_60px_-28px_rgba(37,99,235,0.32)] sm:p-7"
              >
                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20 lp-hover-t group-hover:scale-110 group-hover:bg-brand group-hover:text-white group-hover:ring-brand group-hover:-rotate-3">
                      <LandingIcon name={u.icon} className="h-6 w-6" />
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      {u.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                    {u.title}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {u.description}
                  </p>

                  <ul className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs font-semibold text-slate-700 sm:text-sm">
                    {u.perks.map((p) => (
                      <li key={p} className="lp-hover-t flex items-start gap-2.5 group-hover:translate-x-0.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-2">
                  <button
                    type="button"
                    onClick={() => handleRoleAction(u.role)}
                    className="lp-shine flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 py-3 text-sm font-bold text-slate-800 transition-all duration-300 group-hover:border-brand group-hover:bg-brand group-hover:text-white group-hover:shadow-md group-hover:shadow-brand/20 focus-visible:border-brand active:scale-[0.98]"
                  >
                    <span>{roleButtonLabels[u.role] || 'Enter Portal'}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
