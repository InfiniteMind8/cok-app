import { Fragment, type ReactNode } from 'react'

// Minimal markdown → JSX. Handles only the subset used by legal/privacy.md and legal/terms.md:
//   - h1 / h2 / h3
//   - paragraphs (blank-line separated)
//   - > blockquote
//   - --- horizontal rule
//   - tables with header row
//   - bullet lists (- foo) and numbered lists (1. foo)
//   - inline: **bold**, *italic*, `code`, [link](url)
//
// This is intentionally tiny — no new dep, no client JS, single render at build time. If the
// legal documents need richer formatting later, swap to react-markdown + remark-gfm.

interface InlineToken {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link'
  value: string
  href?: string
}

function parseInline(line: string): InlineToken[] {
  const out: InlineToken[] = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '*' && line[i + 1] === '*') {
      const end = line.indexOf('**', i + 2)
      if (end !== -1) {
        out.push({ type: 'bold', value: line.slice(i + 2, end) })
        i = end + 2
        continue
      }
    }
    if (line[i] === '*') {
      const end = line.indexOf('*', i + 1)
      if (end !== -1) {
        out.push({ type: 'italic', value: line.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }
    if (line[i] === '`') {
      const end = line.indexOf('`', i + 1)
      if (end !== -1) {
        out.push({ type: 'code', value: line.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }
    if (line[i] === '[') {
      const labelEnd = line.indexOf(']', i + 1)
      if (labelEnd !== -1 && line[labelEnd + 1] === '(') {
        const urlEnd = line.indexOf(')', labelEnd + 2)
        if (urlEnd !== -1) {
          out.push({
            type: 'link',
            value: line.slice(i + 1, labelEnd),
            href: line.slice(labelEnd + 2, urlEnd),
          })
          i = urlEnd + 1
          continue
        }
      }
    }
    let chunkEnd = line.length
    for (const marker of ['**', '*', '`', '[']) {
      const idx = line.indexOf(marker, i + 1)
      if (idx !== -1 && idx < chunkEnd) chunkEnd = idx
    }
    out.push({ type: 'text', value: line.slice(i, chunkEnd) })
    i = chunkEnd
  }
  return out
}

function renderInline(line: string, keyPrefix: string): ReactNode {
  return parseInline(line).map((t, idx) => {
    const key = `${keyPrefix}-${idx}`
    switch (t.type) {
      case 'bold':
        return <strong key={key}>{t.value}</strong>
      case 'italic':
        return <em key={key}>{t.value}</em>
      case 'code':
        return (
          <code key={key} className="font-mono text-[0.92em] px-1 py-0.5 rounded bg-karis-stone-100">
            {t.value}
          </code>
        )
      case 'link':
        return (
          <a
            key={key}
            href={t.href}
            className="text-karis-green-900 underline decoration-karis-gold-500 underline-offset-4 hover:decoration-2"
            target={t.href?.startsWith('http') ? '_blank' : undefined}
            rel={t.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {t.value}
          </a>
        )
      default:
        return <Fragment key={key}>{t.value}</Fragment>
    }
  })
}

export function renderMarkdown(md: string): ReactNode[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let blockKey = 0

  while (i < lines.length) {
    const line = lines[i]

    // Blank line — skip.
    if (line.trim() === '') {
      i++
      continue
    }

    // Horizontal rule.
    if (line.trim() === '---') {
      blocks.push(<hr key={`b-${blockKey++}`} className="my-10 border-karis-stone-300" />)
      i++
      continue
    }

    // Headings.
    if (line.startsWith('### ')) {
      blocks.push(
        <h3 key={`b-${blockKey++}`} className="font-display text-xl text-karis-green-900 mt-8 mb-3">
          {renderInline(line.slice(4), `h3-${blockKey}`)}
        </h3>,
      )
      i++
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push(
        <h2 key={`b-${blockKey++}`} className="font-display text-2xl text-karis-green-900 mt-10 mb-4">
          {renderInline(line.slice(3), `h2-${blockKey}`)}
        </h2>,
      )
      i++
      continue
    }
    if (line.startsWith('# ')) {
      // The page already shows the title; treat top-level # as h2.
      blocks.push(
        <h2 key={`b-${blockKey++}`} className="font-display text-2xl text-karis-green-900 mt-10 mb-4">
          {renderInline(line.slice(2), `h1-${blockKey}`)}
        </h2>,
      )
      i++
      continue
    }

    // Blockquote (single paragraph, possibly multi-line continuation).
    if (line.startsWith('> ')) {
      const buf: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        buf.push(lines[i].slice(2))
        i++
      }
      blocks.push(
        <blockquote
          key={`b-${blockKey++}`}
          className="border-l-4 border-karis-gold-500 bg-karis-stone-100/40 pl-4 pr-3 py-3 my-6 text-karis-stone-700 italic"
        >
          {renderInline(buf.join(' '), `bq-${blockKey}`)}
        </blockquote>,
      )
      continue
    }

    // Table (header row | --- separator | body rows).
    if (line.startsWith('|') && i + 1 < lines.length && lines[i + 1].startsWith('|')) {
      const headerCells = line.split('|').slice(1, -1).map((s) => s.trim())
      const sep = lines[i + 1]
      if (/^\|[\s\-:|]+\|$/.test(sep.trim())) {
        i += 2
        const rows: string[][] = []
        while (i < lines.length && lines[i].startsWith('|')) {
          rows.push(lines[i].split('|').slice(1, -1).map((s) => s.trim()))
          i++
        }
        blocks.push(
          <div key={`b-${blockKey++}`} className="overflow-x-auto my-6">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-karis-stone-300">
                  {headerCells.map((c, idx) => (
                    <th key={idx} className="text-left font-display font-semibold text-karis-green-900 py-2 pr-4">
                      {renderInline(c, `th-${idx}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-karis-stone-100">
                    {row.map((c, cIdx) => (
                      <td key={cIdx} className="py-2 pr-4 align-top text-karis-stone-700">
                        {renderInline(c, `td-${rIdx}-${cIdx}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        )
        continue
      }
    }

    // Bullet list.
    if (/^[-*]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, ''))
        i++
      }
      blocks.push(
        <ul key={`b-${blockKey++}`} className="list-disc pl-6 my-4 space-y-2 text-karis-stone-700">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `li-${blockKey}-${idx}`)}</li>
          ))}
        </ul>,
      )
      continue
    }

    // Numbered list.
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      blocks.push(
        <ol key={`b-${blockKey++}`} className="list-decimal pl-6 my-4 space-y-2 text-karis-stone-700">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `oi-${blockKey}-${idx}`)}</li>
          ))}
        </ol>,
      )
      continue
    }

    // Paragraph.
    const buf: string[] = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('> ') &&
      !lines[i].startsWith('|') &&
      lines[i].trim() !== '---' &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i])
    ) {
      buf.push(lines[i])
      i++
    }
    blocks.push(
      <p key={`b-${blockKey++}`} className="my-4 text-karis-stone-700 leading-relaxed">
        {renderInline(buf.join(' '), `p-${blockKey}`)}
      </p>,
    )
  }

  return blocks
}
