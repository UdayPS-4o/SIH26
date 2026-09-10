import { PageHeader, Card } from '../components/common/ui.jsx'

export default function Analytics() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Analytics"
        subtitle="Herd-level correlations and pattern analysis powered by AI"
        actions={
          <span className="flex items-center gap-2 text-xs text-sand-400">
            <span className="h-2 w-2 rounded-full bg-forest-500 animate-pulse-soft" />
            Live analysis
          </span>
        }
      />
      <Card className="p-8 text-center">
        <p className="text-sand-600 dark:text-sand-400 text-lg">AI Analytics module</p>
        <p className="text-sand-400 text-sm mt-2">This page is being rebuilt with full correlation, pattern detection, and seasonal risk features.</p>
      </Card>
    </div>
  )
}
