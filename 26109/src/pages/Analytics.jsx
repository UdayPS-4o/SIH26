import { useMemo } from 'react'
import { PageHeader, Card, SectionTitle, AiDisclaimer } from '../components/common/ui.jsx'
import CorrelationBadge from '../components/common/CorrelationBadge'
import PatternDetector from '../components/common/PatternDetector'
import SeasonalRisk from '../components/common/SeasonalRisk'
import ShedComparison from '../components/common/ShedComparison'
import {
  analyzeCorrelations,
  getHerdPatterns,
  getSeasonalRisk,
  getShedComparison,
  detectPatterns,
} from '../services/analysisService'
import { SHEDS, ANIMALS, animalTimeSeries } from '../data/mockData'
import { useI18n } from '../i18n/i18n.jsx'
import { Network, Eye, Activity, TrendingUp } from 'lucide-react'

export default function Analytics() {
  const { t } = useI18n()
  const correlations = useMemo(() => analyzeCorrelations(), [])
  const herdPatterns = useMemo(() => getHerdPatterns(ANIMALS), [])
  const seasonal = useMemo(() => getSeasonalRisk(new Date().getMonth() + 1), [])
  const shedComp = useMemo(() => getShedComparison(SHEDS), [])

  // Build a map: animalId -> patterns
  const patternsByAnimal = useMemo(() => {
    const map = new Map()
    if (herdPatterns.patternsByType) {
      Object.values(herdPatterns.patternsByType).forEach((arr) => {
        arr.forEach((p) => {
          if (!map.has(p.animalId)) map.set(p.animalId, [])
          map.get(p.animalId).push(p)
        })
      })
    }
    // Also run detectPatterns for animals not yet in the map (especially high-risk)
    ANIMALS.forEach((animal) => {
      if (!map.has(animal.id) && animal.riskScore >= 55) {
        const ts = animalTimeSeries(animal)
        const result = detectPatterns(animal, ts)
        if (result.patterns.length > 0) {
          map.set(animal.id, result.patterns)
        }
      }
    })
    return map
  }, [herdPatterns])

  const animalsWithPatterns = useMemo(() => {
    return ANIMALS.filter((a) => patternsByAnimal.has(a.id)).sort((a, b) => b.riskScore - a.riskScore)
  }, [patternsByAnimal])

  return (
    <div>
      <PageHeader
        title={t('analytics.title')}
        subtitle={t('analytics.sub')}
        actions={
          <span className="flex items-center gap-2 text-xs text-sand-400">
            <span className="h-2 w-2 rounded-full bg-forest-500 animate-pulse-soft" />
            Live analysis · {ANIMALS.length} animals analyzed
          </span>
        }
      />

      {/* Summary KPI row */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-honey-100 text-honey-700 dark:bg-honey-900/30 dark:text-honey-400">
              <Network size={17} />
            </span>
            <div>
              <p className="text-xs text-sand-400">{t('analytics.correlations')}</p>
              <p className="text-lg font-bold text-sand-900 dark:text-sand-100">{correlations.correlations.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <Eye size={17} />
            </span>
            <div>
              <p className="text-xs text-sand-400">{t('analytics.patterns')}</p>
              <p className="text-lg font-bold text-sand-900 dark:text-sand-100">{herdPatterns.totalPatterns}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-ai-light text-ai-dark dark:bg-ai/15 dark:text-ai">
              <Activity size={17} />
            </span>
            <div>
              <p className="text-xs text-sand-400">Affected Animals</p>
              <p className="text-lg font-bold text-sand-900 dark:text-sand-100">{herdPatterns.affectedAnimals}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <TrendingUp size={17} />
            </span>
            <div>
              <p className="text-xs text-sand-400">High Severity</p>
              <p className="text-lg font-bold text-sand-900 dark:text-sand-100">{herdPatterns.highSeverityCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Correlations + Seasonal */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle>{t('analytics.correlations')}</SectionTitle>
          <p className="mb-4 text-xs text-sand-400">{t('analytics.correlations.desc')}</p>
          <div className="space-y-2">
            {correlations.correlations.map((c) => (
              <CorrelationBadge
                key={`${c.factorA}-${c.factorB}`}
                factorA={c.factorA}
                factorB={c.factorB}
                strength={c.strength}
                direction={c.direction}
              />
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle>{t('analytics.seasonal')}</SectionTitle>
          <p className="mb-3 text-xs text-sand-400">Current environmental risk context</p>
          <SeasonalRisk risk={seasonal.risk} factors={seasonal} />
        </Card>
      </div>

      {/* Shed Comparison */}
      <div className="mt-6">
        <Card className="p-5">
          <SectionTitle>{t('analytics.shedCompare')}</SectionTitle>
          <p className="mb-4 text-xs text-sand-400">Comparative risk analysis across all sheds</p>
          <div className="grid gap-6 lg:grid-cols-2">
            <ShedComparison sheds={shedComp.sheds} />
            <div className="space-y-3">
              <div className="rounded-lg border border-sand-200 bg-forest-50/50 p-4 dark:border-forest-900/40 dark:bg-forest-950/20">
                <p className="text-xs font-medium text-sand-500 dark:text-sand-400">Best Performer</p>
                <p className="mt-1 text-sm font-semibold text-forest-700 dark:text-forest-400">
                  {shedComp.best?.name} — {shedComp.best?.risk}% risk
                </p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
                <p className="text-xs font-medium text-red-600 dark:text-red-400">Highest Risk</p>
                <p className="mt-1 text-sm font-semibold text-red-700 dark:text-red-400">
                  {shedComp.worst?.name} — {shedComp.worst?.risk}% risk
                </p>
              </div>
              <div className="rounded-lg border border-sand-200 bg-sand-50/50 p-4 dark:border-barn-800/40 dark:bg-barn-900/30">
                <p className="text-xs font-medium text-sand-500 dark:text-sand-400">Herd Average</p>
                <p className="mt-1 text-sm font-semibold text-sand-900 dark:text-sand-100">{shedComp.avgRisk}%</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* All Detected Patterns by Animal */}
      <div className="mt-6">
        <SectionTitle>{t('analytics.patterns')}</SectionTitle>
        <p className="mb-4 text-xs text-sand-400">
          {t('analytics.insight')} — {herdPatterns.totalPatterns} patterns found across {herdPatterns.affectedAnimals} animals
        </p>
        {animalsWithPatterns.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {animalsWithPatterns.map((animal) => (
              <Card key={animal.id} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-sand-900 dark:text-sand-100">{animal.id}</span>
                  <span className="text-xs text-sand-400">({animal.name})</span>
                  <span className="ml-auto text-xs font-medium text-sand-400">Shed {animal.shed}</span>
                </div>
                <PatternDetector patterns={patternsByAnimal.get(animal.id) || []} />
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-5">
            <p className="text-sm text-sand-400">No patterns detected across the herd at this time.</p>
          </Card>
        )}
      </div>

      {/* Key Insights */}
      <div className="mt-6">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-ai to-ai-dark px-5 py-4 text-white">
            <div className="flex items-center gap-2">
              <Eye size={18} />
              <span className="text-sm font-semibold">{t('analytics.insight')}</span>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-sand-700 dark:text-sand-300">Strongest Correlation</p>
              <p className="mt-1 text-xs text-sand-600 dark:text-sand-400">
                {correlations.correlations[0]?.factorA} ↔ {correlations.correlations[0]?.factorB} —{' '}
                {correlations.correlations[0]?.strength}% {correlations.correlations[0]?.direction} correlation
              </p>
              <p className="text-xs text-sand-400 mt-1">{correlations.correlations[0]?.description}</p>
            </div>
            <div className="border-t border-sand-100 dark:border-barn-800/40 pt-3">
              <p className="text-sm font-medium text-sand-700 dark:text-sand-300">Seasonal Alert</p>
              <p className="mt-1 text-xs text-sand-600 dark:text-sand-400">
                Current risk level: <span className="font-semibold">{seasonal.risk}</span> — {seasonal.label}
              </p>
            </div>
            <div className="border-t border-sand-100 dark:border-barn-800/40 pt-3">
              <p className="text-sm font-medium text-sand-700 dark:text-sand-300">Herd Health Summary</p>
              <p className="mt-1 text-xs text-sand-600 dark:text-sand-400">
                {herdPatterns.totalPatterns} patterns detected across {herdPatterns.affectedAnimals} animals.
                {herdPatterns.highSeverityCount > 0
                  ? ` ${herdPatterns.highSeverityCount} high-severity patterns require immediate attention.`
                  : ' No critical patterns at this time.'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <AiDisclaimer className="mt-4" />
    </div>
  )
}
