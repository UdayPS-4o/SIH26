/**
 * What a page says before any material master has been loaded.
 *
 * The alternative was a page of zeroes, which reads as a broken product rather
 * than an empty one. This says what the page will show, why it is empty, and
 * where the one action that fills it lives - and offers to take the visitor
 * there, because sending somebody looking for a button is not a design.
 */

import { Link } from 'react-router-dom'
import { Database } from '@phosphor-icons/react'
import { Button, Panel } from '@/components/ui'
import { ByMode } from '@/components/Gate'
import { CPSES } from '@/engine/corpus'

export default function NothingLoaded({ what }: { what: string }) {
  return (
    <Panel>
      <div className="flex flex-col items-start gap-3 py-6">
        <p className="font-display text-[15px] font-semibold tracking-tight text-ink">
          Nothing loaded yet
        </p>
        <p className="max-w-[62ch] text-[13px] leading-relaxed text-ink-2">
          {what} There is no data in this system until one of the {CPSES.length} organisations hands
          over its item list.{' '}
          <ByMode
            simple="Load them from the first page and this fills in as it reads."
            technical="Loads run from the Overview. Records commit to the registry as each extract drains, so this page fills while the load is still running."
          />
        </p>
        <Link to="/">
          <Button variant="primary" icon={<Database size={16} weight="regular" />}>
            <ByMode simple="Go and load the item lists" technical="Go to the source loader" />
          </Button>
        </Link>
      </div>
    </Panel>
  )
}
