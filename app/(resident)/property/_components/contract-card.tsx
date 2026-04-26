import { format } from 'date-fns'
import { FileText, ExternalLink } from 'lucide-react'

interface ContractCardProps {
  contractDate: Date
  contractType: string
  contractUrl: string | null
  documents: { name: string; url: string }[]
}

export function ContractCard({
  contractDate,
  contractType,
  contractUrl,
  documents,
}: ContractCardProps) {
  const hasAnything = contractUrl || documents.length > 0

  return (
    <div className="bg-white border border-karis-stone-100 rounded-2xl shadow-sm p-5">
      <h3 className="font-heading text-base text-karis-green-900 mb-4">Contract &amp; Documents</h3>

      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-karis-green-900/5 flex items-center justify-center shrink-0">
          <FileText size={16} className="text-karis-green-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-karis-stone-900">{contractType}</p>
          <p className="font-body text-xs text-karis-stone-500 mt-0.5">
            {format(new Date(contractDate), 'dd MMMM yyyy')}
          </p>
        </div>
        {contractUrl ? (
          <a
            href={contractUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 font-body text-sm text-karis-green-900 border border-karis-green-900 rounded-lg px-3 py-1.5 hover:bg-karis-green-900 hover:text-white transition-colors duration-150 flex items-center gap-1.5"
          >
            View <ExternalLink size={12} />
          </a>
        ) : (
          <span className="shrink-0 font-body text-sm text-karis-stone-400 border border-karis-stone-200 rounded-lg px-3 py-1.5 cursor-not-allowed">
            View
          </span>
        )}
      </div>

      {documents.length > 0 && (
        <>
          <div className="border-t border-karis-stone-100 mt-4 pt-4">
            <p className="font-body text-xs text-karis-stone-500 uppercase tracking-widest mb-3">
              Additional documents
            </p>
            <div className="space-y-2">
              {documents.map((doc, i) => (
                <a
                  key={i}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 py-2.5 px-3 bg-karis-stone-50 rounded-xl hover:bg-karis-stone-100 transition-colors duration-150 min-h-[44px]"
                >
                  <FileText size={15} className="text-karis-green-700 shrink-0" />
                  <span className="font-body text-sm text-karis-green-900 flex-1">{doc.name}</span>
                  <ExternalLink size={12} className="text-karis-stone-400 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </>
      )}

      {!hasAnything && (
        <p className="font-body text-sm text-karis-stone-400 mt-3">
          Documents will be uploaded by your Admin once finalized.
        </p>
      )}
    </div>
  )
}
