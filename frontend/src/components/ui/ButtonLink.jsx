import { Link } from 'react-router-dom'

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className = '',
  ...rest
}) {
  const base =
    'group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.98]'

  const styles = {
    primary:
      'lp-shine bg-gradient-to-r from-brand-bright to-brand text-white shadow-[0_12px_40px_-12px_rgba(0,43,92,0.45)] hover:shadow-[0_18px_44px_-12px_rgba(37,99,235,0.5)]',
    secondary:
      'border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-brand/40 hover:text-brand hover:shadow-md hover:shadow-brand/10',
    ghost: 'text-slate-900 bg-white hover:bg-slate-50 hover:shadow-md shadow-sm ring-1 ring-slate-200/80 hover:ring-brand/30',
  }

  const combinedClassName = `${base} ${styles[variant]} ${className}`

  if (href.startsWith('http') || href.startsWith('#')) {
    return (
      <a href={href} className={combinedClassName} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <Link to={href} className={combinedClassName} {...rest}>
      {children}
    </Link>
  )
}
