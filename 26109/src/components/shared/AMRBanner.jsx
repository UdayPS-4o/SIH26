export default function AMRBanner() {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/30">
      <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
        🛡️ Early detection = antimicrobial stewardship
        <span className="ml-2 text-emerald-600 dark:text-emerald-400">
          No antibiotic prescribed by this system.
          Staphylococcus β-lactam resistance: 71.36% (organised) / 76.59% (unorganised).
          Source: Antibiotics 2026;15(3):256
        </span>
      </p>
    </div>
  )
}
