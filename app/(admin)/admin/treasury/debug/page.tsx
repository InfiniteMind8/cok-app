import { getAllWalletRows, formatKCredit } from '@/lib/ledger/balance'
import { reconcileTreasury } from '@/lib/ledger/reconciliation'

export const dynamic = 'force-dynamic'

export default async function TreasuryDebugPage() {
  const [wallets, recon] = await Promise.all([getAllWalletRows(), reconcileTreasury()])

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-display text-3xl text-karis-stone-900 mb-2">Treasury Debug</h1>
      <p className="text-xs text-karis-stone-400 mb-8">
        Live read — refreshes on each page load.
      </p>

      {/* Reconciliation card */}
      <div
        className={`rounded-xl p-6 mb-8 border ${
          recon.isBalanced
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-3 h-3 rounded-full ${
              recon.isBalanced ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span
            className={`font-semibold text-lg ${
              recon.isBalanced ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {recon.isBalanced ? 'BALANCED ✓' : 'DISCREPANCY DETECTED ✗'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-karis-stone-500 mb-0.5">Total Issued (TREASURY_ADJUSTMENT)</div>
            <div className="font-mono font-semibold text-karis-stone-900">
              {formatKCredit(recon.totalIssued)}
            </div>
          </div>
          <div>
            <div className="text-karis-stone-500 mb-0.5">Sum of All Ledger Entries</div>
            <div className="font-mono font-semibold text-karis-stone-900">
              {formatKCredit(recon.sumAllEntries)}
            </div>
          </div>
          {!recon.isBalanced && (
            <div className="col-span-2">
              <div className="text-red-600 mb-0.5">Discrepancy</div>
              <div className="font-mono font-bold text-red-700">
                {formatKCredit(recon.discrepancy)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wallet balances table */}
      <div className="bg-white rounded-xl border border-karis-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-karis-stone-100">
          <h2 className="font-semibold text-karis-stone-900">Wallet Balances</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-karis-stone-100 text-karis-stone-500">
              <th className="text-left px-6 py-3 font-medium">Wallet</th>
              <th className="text-left px-6 py-3 font-medium">Type</th>
              <th className="text-right px-6 py-3 font-medium tabular-nums">Balance</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((w) => (
              <tr
                key={w.walletId}
                className="border-b border-karis-stone-50 last:border-0 hover:bg-karis-stone-50 transition-colors"
              >
                <td className="px-6 py-3 text-karis-stone-900 font-medium">
                  {w.displayName}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      w.isSystem
                        ? 'bg-karis-stone-100 text-karis-stone-600'
                        : 'bg-karis-green-50 text-karis-green-700'
                    }`}
                  >
                    {w.isSystem ? 'System' : 'User'}
                  </span>
                </td>
                <td className="px-6 py-3 text-right font-mono tabular-nums text-karis-stone-900">
                  {formatKCredit(w.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
