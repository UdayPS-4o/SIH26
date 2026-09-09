import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight } from 'lucide-react'
import { useI18n } from '../../i18n/i18n.jsx'

export function QuarantineTable({ animals = [] }) {
  const { t } = useI18n()

  if (!animals.length) {
    return (
      <div className="card p-8 text-center">
        <AlertTriangle className="mx-auto text-sand-300 dark:text-barn-600" size={28} />
        <p className="mt-2 text-sm font-medium text-sand-600 dark:text-sand-400">{t('prev.quarantine')}</p>
        <p className="mt-1 text-xs text-sand-400">No animals currently flagged for segregation.</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-red-100 bg-red-50/60 px-5 py-3 dark:border-red-900/30 dark:bg-red-950/20">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
          <span className="text-sm font-semibold text-red-700 dark:text-red-400">{t('prev.quarantine')}</span>
          <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/40 dark:text-red-400">
            {animals.length}
          </span>
        </div>
        <p className="mt-1 text-xs text-sand-500 dark:text-sand-400">{t('prev.quarantine.desc')}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 bg-sand-100/80 text-left text-xs uppercase tracking-wider text-sand-500 dark:border-barn-800/60 dark:bg-barn-900/30 dark:text-sand-400">
              <th className="px-4 py-2.5 font-medium">Animal ID</th>
              <th className="px-4 py-2.5 font-medium">Risk Score</th>
              <th className="px-4 py-2.5 font-medium">Shed</th>
              <th className="px-4 py-2.5 font-medium">Segregation Reason</th>
              <th className="px-4 py-2.5 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-barn-800/40">
            {animals.map((a) => (
              <tr key={a.id} className="hover:bg-sand-50/70 dark:hover:bg-barn-800/20">
                <td className="px-4 py-3 font-medium text-sand-900 dark:text-sand-100">{a.id}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-red-600 dark:text-red-400">{a.riskScore}%</span>
                </td>
                <td className="px-4 py-3 text-sand-600 dark:text-sand-400">{a.shed}</td>
                <td className="px-4 py-3 text-xs text-sand-600 dark:text-sand-400">{a.quarantineReason}</td>
                <td className="px-4 py-3">
                  <Link to={`/animals/${a.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-honey-700 hover:underline dark:text-honey-400">
                    {t('common.viewAnimal')} <ArrowUpRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
