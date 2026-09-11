import { useState } from 'react'
import { Copy, PaperPlaneRight, Play } from '@phosphor-icons/react'
import { PageHeader, Panel, Callout, Button } from '@/ds'

const SAMPLE_RESPONSE = {
  apiVersion: '1.0',
  indexName: 'APIx - Airfare Price Index',
  asOf: '2026-09-11T06:15:00+05:30',
  frequency: 'monthly',
  baseDate: '2024-01-01',
  baseIndex: 100.0,
  currentIndex: 104.42,
  yoyChange: 8.4,
  sectors: [
    { sectorCode: 'DEL-BOM', cityPair: 'Delhi – Mumbai', indexValue: 108.7, change30d: 4.2, changeYoY: 6.8 },
    { sectorCode: 'DEL-BLR', cityPair: 'Delhi – Bangalore', indexValue: 96.3, change30d: -1.8, changeYoY: -4.2 },
    { sectorCode: 'BOM-BLR', cityPair: 'Mumbai – Bangalore', indexValue: 102.1, change30d: 0.5, changeYoY: 3.1 },
    { sectorCode: 'DEL-CCU', cityPair: 'Delhi – Kolkata', indexValue: 111.4, change30d: 6.1, changeYoY: 10.2 },
    { sectorCode: 'BLR-HYD', cityPair: 'Bangalore – Hyderabad', indexValue: 94.8, change30d: -3.2, changeYoY: -2.5 },
    { sectorCode: 'MAA-DEL', cityPair: 'Chennai – Delhi', indexValue: 107.3, change30d: 2.8, changeYoY: 7.1 },
  ],
  metadata: {
    sources: ['IndiGo', 'Air India', 'Akasa Air', 'SpiceJet', 'Air India Express', 'MakeMyTrip', 'Yatra', 'EaseMyTrip', 'Cleartrip', 'Ixigo', 'Goibibo'],
    quotesIngested: 2847,
    lastScrape: '2026-09-11T06:15:00+05:30',
    nextScrape: '2026-09-11T18:00:00+05:30',
    basketSize: 24,
    advancePurchaseWindows: ['T+1', 'T+7', 'T+15', 'T+30', 'T+45'],
  },
}

export default function ApiPlaygroundPage() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(SAMPLE_RESPONSE, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleSampleCall = () => {
    // No real backend yet — just show the sample response
  }

  return (
    <div>
      <PageHeader
        kicker="For NSO / RBI integration"
        title="API Playground"
        lede="Explore the REST API that MoSPI and RBI can integrate with for real-time airfare data."
      />

      <Callout tone="accent" title="Sample response — no backend required yet">
        This playground returns a pre-built JSON response to demonstrate the API contract.
        The actual endpoint will be deployed with the production backend. Copy this payload
        to share with integration teams at MoSPI.
      </Callout>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr,1.4fr]">
        {/* Request builder */}
        <Panel title="Request" meta="GET /api/v1/apix" icon={PaperPlaneRight}>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
                Endpoint
              </label>
              <div className="rounded-control bg-surface-inset px-3 py-2 font-mono text-[12px] text-ink ring-1 ring-line">
                GET /api/v1/apix
              </div>
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-ink-3">
                Query parameters
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="rounded-chip bg-surface-3 px-2 py-0.5 font-mono text-[11px] text-ink-2">
                    frequency
                  </code>
                  <span className="text-[11.5px] text-ink-3">=</span>
                  <select className="flex-1 rounded-control bg-surface-2 px-2 py-1 text-[12px] ring-1 ring-line">
                    <option>daily</option>
                    <option selected>weekly</option>
                    <option>monthly</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <code className="rounded-chip bg-surface-3 px-2 py-0.5 font-mono text-[11px] text-ink-2">
                    sector
                  </code>
                  <span className="text-[11.5px] text-ink-3">=</span>
                  <select className="flex-1 rounded-control bg-surface-2 px-2 py-1 text-[12px] ring-1 ring-line">
                    <option value="">All sectors</option>
                    <option>DEL-BOM</option>
                    <option>DEL-BLR</option>
                    <option>BOM-BLR</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <code className="rounded-chip bg-surface-3 px-2 py-0.5 font-mono text-[11px] text-ink-2">
                    from / to
                  </code>
                  <span className="text-[11.5px] text-ink-3">=</span>
                  <input
                    type="date"
                    defaultValue="2024-01-01"
                    className="flex-1 rounded-control bg-surface-2 px-2 py-1 text-[12px] ring-1 ring-line"
                  />
                  <span className="text-ink-3">→</span>
                  <input
                    type="date"
                    defaultValue="2026-09-11"
                    className="flex-1 rounded-control bg-surface-2 px-2 py-1 text-[12px] ring-1 ring-line"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleSampleCall}
                className="!px-3 !py-1.5 text-[11.5px]"
              >
                <Play size={13} weight="bold" />
                Send request
              </Button>
              <Button
                onClick={handleCopy}
                className="!px-3 !py-1.5 text-[11.5px]"
              >
                <Copy size={13} weight="bold" />
                {copied ? 'Copied!' : 'Copy response'}
              </Button>
            </div>
          </div>
        </Panel>

        {/* Response viewer */}
        <Panel title="Response" meta="200 OK · 142 ms">
          <pre className="overflow-auto rounded-control bg-surface-inset p-4 font-mono text-[11.5px] leading-relaxed text-ink-2 ring-1 ring-line">
            {JSON.stringify(SAMPLE_RESPONSE, null, 2)}
          </pre>
        </Panel>
      </div>

      {/* Curl snippet */}
      <Panel className="mt-4" title="cURL example">
        <pre className="overflow-auto rounded-control bg-surface-inset p-4 font-mono text-[11.5px] leading-relaxed text-ink-2 ring-1 ring-line">
{`curl -X GET "https://api.apix.gov.in/v1/apix?frequency=monthly&sector=DEL-BOM" \\
  -H "Authorization: Bearer <API_KEY>" \\
  -H "Accept: application/json"`}
        </pre>
      </Panel>
    </div>
  )
}
