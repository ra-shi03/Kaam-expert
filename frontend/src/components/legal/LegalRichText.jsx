import { parseInline } from '../../lib/legalContent.js'

export function Inline({ text }) {
  return parseInline(text).map((part, i) => {
    if (part.kind === 'bold') return <strong key={i} className="font-bold text-slate-900">{part.text}</strong>
    if (part.kind === 'link') {
      const external = /^https?:/i.test(part.href)
      return (
        <a
          key={i}
          href={part.href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="font-semibold text-brand underline decoration-brand/30 underline-offset-2 transition hover:decoration-brand"
        >
          {part.text}
        </a>
      )
    }
    return <span key={i}>{part.text}</span>
  })
}

export function Blocks({ blocks }) {
  return blocks.map((block, i) => {
    if (block.type === 'h3') {
      return <h3 key={i} className="mt-5 text-base font-bold text-slate-900 first:mt-0">{block.text}</h3>
    }
    if (block.type === 'list') {
      const Tag = block.ordered ? 'ol' : 'ul'
      return (
        <Tag key={i} className="mt-3 space-y-2.5 first:mt-0">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-slate-600">
              {block.ordered ? (
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand">{j + 1}</span>
              ) : (
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
              )}
              <span className="min-w-0"><Inline text={item} /></span>
            </li>
          ))}
        </Tag>
      )
    }
    return <p key={i} className="mt-3 text-[15px] leading-relaxed text-slate-600 first:mt-0"><Inline text={block.text} /></p>
  })
}
