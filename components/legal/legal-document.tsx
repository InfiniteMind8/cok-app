import { renderMarkdown } from './render-markdown'

interface Props {
  markdown: string
  title: string
}

export function LegalDocument({ markdown, title }: Props) {
  const blocks = renderMarkdown(markdown)
  return (
    <main className="bg-karis-stone-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        <p className="font-display text-karis-gold-500 text-xs tracking-[0.2em] uppercase mb-3">
          City of Karis
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-karis-green-900 mb-8">{title}</h1>
        <article className="legal-prose">{blocks}</article>
      </div>
    </main>
  )
}
