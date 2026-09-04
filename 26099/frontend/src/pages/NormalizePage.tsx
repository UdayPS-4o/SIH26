/**
 * Normalization.
 *
 * The instrument page. A visitor types a description of their own choosing and
 * watches it decompose: tokens, dictionary expansions, attribute slots, canonical
 * signature, unit, code. Nothing is asserted that is not shown.
 *
 * The second half is the dictionary itself, listed and extendable. Adding a rule
 * goes through the service and the instrument above re-runs against the extended
 * rule set, which is the argument that this is a dictionary a procurement officer
 * owns rather than a model they cannot reach.
 */

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, MagnifyingGlass, Plus } from '@phosphor-icons/react'

import {
  Button,
  Chip,
  EmptyState,
  EndpointTag,
  ErrorState,
  Field,
  Mono,
  Num,
  PageHead,
  Panel,
  PanelHead,
  Select,
  Skeleton,
  Table,
  Td,
  TextInput,
  Textarea,
  Th,
} from '@/components/ui'
import { ByMode, TechnicalOnly } from '@/components/Gate'
import { useCopy } from '@/copy'
import { useService } from '@/store/service'
import {
  fetchDictionary,
  normalizeDescription,
  type NormalizeResponse,
} from '@/api/endpoints'
import type { RequestMeta } from '@/api/client'
import { BASE_RULES, STOP_TOKENS, buildIndex, type DictionaryRule } from '@/engine/dictionary'
import { describeSignature } from '@/engine/normalize'
import { codeDerivation, mintCode } from '@/engine/cluster'
import {
  ATTRIBUTE_SLOTS,
  FAMILY_LABEL,
  type AttributeSlot,
  type MaterialFamily,
} from '@/engine/types'

/* --------------------------------------------------------------- local values */

/** Raw unit strings as they are actually written in the four material masters.
 *  Each one is a key the normalizer already knows how to collapse. */
const RAW_UOMS = ['NOS', 'EA', 'PCS', 'NO', 'MTR', 'M', 'RMT', 'KG', 'KGS', 'LTR', 'L']

const SEED_DESCRIPTION = 'BRG BALL DG 6205 2RS SKF'

/**
 * The round trip the page is built to demonstrate. NBR is not in the base
 * dictionary and matches none of the shape heuristics, so it contributes nothing
 * and the material slot stays empty until someone writes the rule down.
 */
const UNKNOWN_DEMO = {
  description: 'GSKT NBR 150NB CL150 IS 2712',
  uom: 'NOS',
  family: 'gaskets_seals' as MaterialFamily,
  token: 'NBR',
  expansion: 'NITRILE RUBBER',
  slot: 'material' as AttributeSlot,
}

const SLOT_PLAIN: Record<AttributeSlot, string> = {
  noun: 'What the item is',
  variant: 'Which kind',
  material: 'What it is made of',
  grade: 'Grade',
  dimension: 'Size',
  rating: 'Pressure or electrical rating',
  standard: 'Official standard',
}

const SOURCE_OPTIONS: DictionaryRule['source'][] = ['MRO', 'SAP', 'IS', 'UOM']

/** `useCopy` returns a fresh closure each render, so it cannot be an effect
 *  dependency. Failure messages inside effects use this instead. */
const SERVICE_FAILED = 'The harmonization service did not answer that call.'

/* ----------------------------------------------------------- local primitives */

/** One decomposition stage. Stages are separated by rules, never boxed, so the
 *  sequence reads as one operation rather than six unrelated results. */
function Stage({
  step,
  title,
  note,
  children,
}: {
  step: number
  title: ReactNode
  note?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="border-t border-rule px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Num size="xs" className="text-ink-3">
          {step}
        </Num>
        <h3 className="font-display text-[13px] font-semibold tracking-tight text-ink">{title}</h3>
        {note ? <span className="text-[12px] text-ink-3">{note}</span> : null}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

/** Opacity-only transition, keyed on the value so a keystroke that changes nothing
 *  does not restart the fade. */
function Fade({ id, children }: { id: string; children: ReactNode }) {
  const reduce = useReducedMotion()
  if (reduce) return <>{children}</>
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  )
}

/** A token the normalizer discarded. Shown rather than hidden, so what was thrown
 *  away is as visible as what was kept. */
function DroppedToken({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center border border-rule px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-3 line-through">
      {children}
    </span>
  )
}

function Quiet({ children }: { children: ReactNode }) {
  return <p className="max-w-[68ch] text-[13px] leading-relaxed text-ink-2">{children}</p>
}

/* ------------------------------------------------------------------- the page */

export default function NormalizePage() {
  const c = useCopy()
  const reduce = useReducedMotion()

  const addRule = useService(s => s.addRule)
  /** Changes identity on every store refresh, and `addRule` refreshes. Using it as
   *  a dependency is what makes a dictionary edit re-run the instrument. */
  const lastCall = useService(s => s.lastCall)

  const [description, setDescription] = useState(SEED_DESCRIPTION)
  const [uom, setUom] = useState('NOS')
  const [family, setFamily] = useState<MaterialFamily>('bearings')
  const [attempt, setAttempt] = useState(0)

  const [result, setResult] = useState<NormalizeResponse | null>(null)
  const [meta, setMeta] = useState<RequestMeta | null>(null)
  const [pending, setPending] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sequence = useRef(0)

  /* ------------------------------------------------------- the instrument call */

  useEffect(() => {
    const trimmed = description.trim()
    if (!trimmed) {
      sequence.current += 1
      setResult(null)
      setMeta(null)
      setError(null)
      setPending(false)
      return
    }

    setPending(true)
    const id = ++sequence.current
    const timer = window.setTimeout(() => {
      normalizeDescription(trimmed, uom)
        .then(response => {
          if (sequence.current !== id) return
          setResult(response.data)
          setMeta(response.meta)
          setError(null)
          setPending(false)
        })
        .catch(caught => {
          if (sequence.current !== id) return
          setError(caught instanceof Error ? caught.message : SERVICE_FAILED)
          setPending(false)
        })
    }, 180)

    return () => window.clearTimeout(timer)
    // `lastCall` is the dictionary-changed signal; `attempt` is the retry.
  }, [description, uom, lastCall, attempt])

  /* --------------------------------------------------------- the dictionary call */

  const [rules, setRules] = useState<DictionaryRule[] | null>(null)
  const [dictMeta, setDictMeta] = useState<RequestMeta | null>(null)
  const [dictError, setDictError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    fetchDictionary()
      .then(response => {
        if (!live) return
        setRules(response.data.rules)
        setDictMeta(response.meta)
        setDictError(null)
      })
      .catch(caught => {
        if (!live) return
        setDictError(caught instanceof Error ? caught.message : SERVICE_FAILED)
      })
    return () => {
      live = false
    }
  }, [lastCall, attempt])

  const ruleIndex = useMemo(() => buildIndex(rules ?? BASE_RULES), [rules])

  /** Rules the base dictionary did not ship with, marked and floated to the top so
   *  a rule added thirty seconds ago is findable among two hundred. */
  const flagged = useMemo(() => {
    const all = rules ?? []
    const marked = all.map((rule, index) => ({ rule, added: index >= BASE_RULES.length }))
    return [...marked.filter(entry => entry.added).reverse(), ...marked.filter(entry => !entry.added)]
  }, [rules])

  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const needle = search.trim().toUpperCase()
    if (!needle) return flagged
    return flagged.filter(({ rule }) =>
      `${rule.token} ${rule.expansion} ${rule.slot ?? 'no slot'} ${rule.source}`
        .toUpperCase()
        .includes(needle),
    )
  }, [flagged, search])

  /* ------------------------------------------------------------ add a rule form */

  const [formToken, setFormToken] = useState('')
  const [formExpansion, setFormExpansion] = useState('')
  const [formSlot, setFormSlot] = useState<AttributeSlot | 'none'>('noun')
  const [formSource, setFormSource] = useState<DictionaryRule['source']>('MRO')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [added, setAdded] = useState<DictionaryRule | null>(null)

  async function submitRule(event: FormEvent) {
    event.preventDefault()
    const token = formToken.trim().toUpperCase()
    const expansion = formExpansion.trim().toUpperCase()

    if (!token) {
      setFormError('Give the short form as it appears in a material master.')
      return
    }
    if (/\s/.test(token)) {
      setFormError('A rule matches one token. Remove the space.')
      return
    }
    if (!expansion) {
      setFormError('Give what the short form means.')
      return
    }

    const rule: DictionaryRule = {
      token,
      expansion,
      slot: formSlot === 'none' ? null : formSlot,
      source: formSource,
    }

    setFormError(null)
    setSaving(true)
    try {
      await addRule(rule)
      setAdded(rule)
      setFormToken('')
      setFormExpansion('')
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : SERVICE_FAILED)
    } finally {
      setSaving(false)
    }
  }

  function loadDemo() {
    setDescription(UNKNOWN_DEMO.description)
    setUom(UNKNOWN_DEMO.uom)
    setFamily(UNKNOWN_DEMO.family)
    setFormToken(UNKNOWN_DEMO.token)
    setFormExpansion(UNKNOWN_DEMO.expansion)
    setFormSlot(UNKNOWN_DEMO.slot)
    setFormSource('MRO')
    setAdded(null)
    setFormError(null)
    setSearch('')
  }

  /* ---------------------------------------------------------------- derivations */

  const normalized = result?.normalized ?? null
  const attributes = normalized?.attributes ?? {}
  const expansions = normalized?.expansions ?? []
  const signature = normalized?.signature ?? ''
  const readable = normalized ? describeSignature(normalized.attributes) : ''
  const filledSlots = ATTRIBUTE_SLOTS.filter(slot => attributes[slot]).length
  const droppedCount = normalized
    ? normalized.tokens.filter(token => !ruleIndex.has(token) && STOP_TOKENS.has(token)).length
    : 0

  function slotOrigin(slot: AttributeSlot, value: string): string {
    if (slot === 'standard') return 'standards pattern'
    return expansions.some(expansion => expansion.to === value) ? 'dictionary rule' : 'shape rule'
  }

  /* --------------------------------------------------------------------- render */

  return (
    <div className="flex flex-col gap-7">
      <PageHead title={c('normalizeTitle')} lead={c('normalizeLead')} />

      {/* ------------------------------------------------------------ instrument */}

      <Panel flush>
        <PanelHead
          title={
            <ByMode
              simple="Type anything and watch it get sorted out"
              technical="Normalize a description"
            />
          }
          meta={
            result ? (
              <ByMode
                simple={`${result.dictionarySize} short forms known`}
                technical={`${result.dictionarySize} rules in effect`}
              />
            ) : undefined
          }
          action={
            meta ? (
              <TechnicalOnly>
                <EndpointTag
                  method={meta.method}
                  endpoint={meta.endpoint}
                  ms={meta.ms}
                  scanned={meta.scanned}
                />
              </TechnicalOnly>
            ) : undefined
          }
        />

        <div className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_170px_200px]">
          <Field
            label="Description as written in the source system"
            helper="Abbreviated, punctuated, inconsistent. Whatever an engineer actually typed."
          >
            <Textarea
              rows={2}
              value={description}
              spellCheck={false}
              onChange={event => setDescription(event.target.value)}
              placeholder={SEED_DESCRIPTION}
              aria-label="Description as written in the source system"
            />
          </Field>

          <Field label="Unit as stored" helper="The raw string, not the clean one.">
            <Select value={uom} onChange={event => setUom(event.target.value)} aria-label="Unit as stored">
              {RAW_UOMS.map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Classification family"
            helper="Sets the two-letter prefix of the code."
          >
            <Select
              value={family}
              onChange={event => setFamily(event.target.value as MaterialFamily)}
              aria-label="Classification family"
            >
              {(Object.keys(FAMILY_LABEL) as MaterialFamily[]).map(value => (
                <option key={value} value={value}>
                  {FAMILY_LABEL[value]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {error ? (
          <div className="px-5 pb-5">
            <ErrorState message={error} onRetry={() => setAttempt(value => value + 1)} />
          </div>
        ) : !description.trim() ? (
          <div className="px-5 pb-5">
            <EmptyState
              title="Nothing to take apart yet"
              detail="Type a description above. Anything from a material master will do, however badly abbreviated."
              action={
                <Button size="sm" onClick={() => setDescription(SEED_DESCRIPTION)}>
                  Use a real line
                </Button>
              }
            />
          </div>
        ) : !normalized ? (
          <div className="px-5 pb-5">
            {pending ? (
              <Skeleton rows={6} />
            ) : (
              <EmptyState
                title="The service returned nothing for that line"
                detail="The call completed but carried no decomposition. Run it again, or shorten the description."
                action={
                  <Button size="sm" onClick={() => setAttempt(value => value + 1)}>
                    Run it again
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <>
            {/* 1 ------------------------------------------------------- tokens */}
            <Stage
              step={1}
              title={<ByMode simple="Split into words" technical="Tokens" />}
              note={
                <>
                  <Num size="xs">{normalized.tokens.length}</Num> in order,{' '}
                  <Num size="xs">{droppedCount}</Num> dropped
                </>
              }
            >
              <Fade id={`tokens:${normalized.tokens.join(' ')}`}>
                {normalized.tokens.length === 0 ? (
                  <Quiet>Nothing survived punctuation stripping. Try a longer description.</Quiet>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {normalized.tokens.map((token, index) => {
                      const dropped = !ruleIndex.has(token) && STOP_TOKENS.has(token)
                      return dropped ? (
                        <DroppedToken key={`${token}-${index}`}>{token}</DroppedToken>
                      ) : (
                        <Chip key={`${token}-${index}`}>{token}</Chip>
                      )
                    })}
                  </div>
                )}
              </Fade>
              <p className="mt-3 max-w-[68ch] text-[12.5px] leading-relaxed text-ink-3">
                <ByMode
                  simple="Struck-out words are filler such as TYPE, SET or ASSEMBLY. They appear in every description and tell you nothing, so they are set aside."
                  technical="Struck-out tokens are stop words. They carry no discriminating information and are dropped before scoring. A stop word covered by a dictionary rule is kept."
                />
              </p>
            </Stage>

            {/* 2 --------------------------------------------------- expansions */}
            <Stage
              step={2}
              title={<ByMode simple="Short forms written out" technical="Dictionary expansions" />}
              note={
                <>
                  <Num size="xs">{expansions.length}</Num> fired
                </>
              }
            >
              <Fade id={`exp:${expansions.map(e => `${e.from}>${e.to}`).join(',')}`}>
                {expansions.length === 0 ? (
                  <Quiet>
                    <ByMode
                      simple="No short form in this line is one the dictionary knows. Everything passed through as typed."
                      technical="No rule matched. Every token passed through unexpanded and only the shape heuristics had anything to work with."
                    />
                  </Quiet>
                ) : (
                  <ul className="flex flex-col">
                    {expansions.map((expansion, index) => (
                      <li
                        key={`${expansion.from}-${index}`}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-rule py-2 last:border-b-0"
                      >
                        <Mono>{expansion.from}</Mono>
                        <ArrowRight size={16} weight="regular" className="text-ink-3" />
                        <span className="text-[13px] text-ink">{expansion.to}</span>
                        <TechnicalOnly>
                          <span className="ml-auto font-mono text-[11px] text-ink-3">
                            {expansion.rule}
                          </span>
                        </TechnicalOnly>
                      </li>
                    ))}
                  </ul>
                )}
              </Fade>
            </Stage>

            {/* 3 ------------------------------------------------ attribute slots */}
            <Stage
              step={3}
              title={<ByMode simple="Specifications pulled out" technical="Attribute slots" />}
              note={
                <>
                  <Num size="xs">{filledSlots}</Num> of{' '}
                  <Num size="xs">{ATTRIBUTE_SLOTS.length}</Num> filled
                </>
              }
            >
              <Fade id={`slots:${signature}`}>
                <dl className="border-t border-rule">
                  {ATTRIBUTE_SLOTS.map(slot => {
                    const value = attributes[slot]
                    return (
                      <div
                        key={slot}
                        className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-rule py-2"
                      >
                        <dt className="w-40 shrink-0">
                          <ByMode
                            simple={
                              <span className="text-[12.5px] text-ink-2">{SLOT_PLAIN[slot]}</span>
                            }
                            technical={
                              <span className="font-mono text-[12px] text-ink-2">{slot}</span>
                            }
                          />
                        </dt>
                        <dd className="min-w-0 flex-1">
                          {value ? (
                            <span className="text-[13px] text-ink">{value}</span>
                          ) : (
                            <span className="text-[13px] text-ink-3">not stated</span>
                          )}
                        </dd>
                        {value ? (
                          <TechnicalOnly>
                            <span className="font-mono text-[11px] text-ink-3">
                              {slotOrigin(slot, value)}
                            </span>
                          </TechnicalOnly>
                        ) : null}
                      </div>
                    )
                  })}
                </dl>
              </Fade>
              <p className="mt-3 max-w-[68ch] text-[12.5px] leading-relaxed text-ink-3">
                <ByMode
                  simple="The empty rows matter as much as the filled ones. They are the questions the description never answered, and they are the same seven questions for every item in the country."
                  technical="Empty slots are shown deliberately. The slot set is fixed and ordered, so an omission is recorded as an omission rather than silently absorbed, and two records can disagree about a slot neither one filled."
                />
              </p>
            </Stage>

            {/* 4 ------------------------------------------------------ signature */}
            <Stage
              step={4}
              title={<ByMode simple="The agreed description" technical="Canonical signature" />}
            >
              <Fade id={`sig:${signature}`}>
                {signature ? (
                  <div className="flex flex-col gap-3">
                    <div className="overflow-x-auto">
                      <Mono className="whitespace-nowrap">{signature}</Mono>
                    </div>
                    <p className="max-w-[68ch] text-[13px] leading-relaxed text-ink">{readable}</p>
                  </div>
                ) : (
                  <Quiet>
                    No slot was filled, so there is no signature. Two descriptions that both
                    reach this point are not comparable on attributes at all.
                  </Quiet>
                )}
              </Fade>
              <TechnicalOnly>
                <p className="mt-3 max-w-[68ch] text-[12.5px] leading-relaxed text-ink-3">
                  Slot values in slot order, pipe joined, empty slots skipped. Two records that
                  produce this string produce the same code by construction.
                </p>
              </TechnicalOnly>
            </Stage>

            {/* 5 ----------------------------------------------------------- unit */}
            <Stage step={5} title={<ByMode simple="Unit" technical="Unit of measure" />}>
              <Fade id={`uom:${uom}->${normalized.uom}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <Mono>{uom}</Mono>
                  <ArrowRight size={16} weight="regular" className="text-ink-3" />
                  <Mono>{normalized.uom}</Mono>
                  <span className="text-[12.5px] text-ink-3">
                    <ByMode
                      simple="Piece, number, each and NOS all mean the same thing to a storekeeper. They have to mean the same thing to the system."
                      technical="Collapsed against the canonical unit table, so NOS, NO, EA and PCS do not read as four different units."
                    />
                  </span>
                </div>
              </Fade>
            </Stage>

            {/* 6 ----------------------------------------------------------- code */}
            <Stage step={6} title={<ByMode simple="The national code" technical={c('nationalCode')} />}>
              <Fade id={`code:${family}:${signature}`}>
                {signature ? (
                  <div className="flex flex-col gap-3">
                    <Num size="lg" className="text-ink">
                      {mintCode(family, signature)}
                    </Num>
                    <TechnicalOnly>
                      <div className="overflow-x-auto">
                        <span className="whitespace-nowrap font-mono text-[11.5px] text-ink-3">
                          {codeDerivation(family, signature)}
                        </span>
                      </div>
                    </TechnicalOnly>
                    <p className="max-w-[68ch] text-[12.5px] leading-relaxed text-ink-3">
                      <ByMode
                        simple="The code is worked out from the description itself, not handed out in order. The same item described the same way gets the same code in Delhi and in Durgapur."
                        technical="The code is a pure function of family and signature. It is not a sequence and it is not stored: the same signature mints the same code on any machine."
                      />
                    </p>
                  </div>
                ) : (
                  <Quiet>
                    There is nothing to mint from. A code is derived from the signature, and this
                    description did not produce one.
                  </Quiet>
                )}
              </Fade>
            </Stage>
          </>
        )}
      </Panel>

      {/* ------------------------------------------------------------ dictionary */}

      <Panel flush>
        <PanelHead
          title={<ByMode simple="The list of short forms" technical="Abbreviation dictionary" />}
          meta={
            rules ? (
              <>
                <Num size="xs">{rules.length}</Num> rules,{' '}
                <Num size="xs">{Math.max(0, rules.length - BASE_RULES.length)}</Num> added here
              </>
            ) : undefined
          }
          action={
            dictMeta ? (
              <TechnicalOnly>
                <EndpointTag
                  method={dictMeta.method}
                  endpoint={dictMeta.endpoint}
                  ms={dictMeta.ms}
                  scanned={dictMeta.scanned}
                />
              </TechnicalOnly>
            ) : undefined
          }
        />

        <div className="border-b border-rule px-5 py-4">
          <p className="max-w-[76ch] text-[13px] leading-relaxed text-ink-2">
            <ByMode
              simple="Try this. Type a short form nobody has taught it yet. It will pass straight through and the specification row will stay empty. Then write the rule below and watch the same line fill in, with no waiting and nothing to retrain. The person who knows what the short form means writes it down once."
              technical="Try this. Put an unknown abbreviation in the instrument above: it passes through stage 2 unexpanded and its slot stays empty in stage 3. Add the rule below and the instrument re-runs against the extended rule set immediately. The dictionary is the model, and it is editable by the people who own the vocabulary."
            />
          </p>
          <div className="mt-3">
            <Button size="sm" onClick={loadDemo}>
              Set up that example
            </Button>
          </div>
        </div>

        <form onSubmit={submitRule} className="border-b border-rule px-5 py-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_170px_120px_auto] md:items-end">
            <Field label="Short form">
              <TextInput
                value={formToken}
                spellCheck={false}
                onChange={event => setFormToken(event.target.value)}
                placeholder="NBR"
                className="font-mono uppercase"
                aria-label="Short form"
              />
            </Field>

            <Field label="What it means">
              <TextInput
                value={formExpansion}
                spellCheck={false}
                onChange={event => setFormExpansion(event.target.value)}
                placeholder="NITRILE RUBBER"
                className="uppercase"
                aria-label="What it means"
              />
            </Field>

            <Field label="Slot it fills">
              <Select
                value={formSlot}
                onChange={event => setFormSlot(event.target.value as AttributeSlot | 'none')}
                aria-label="Slot it fills"
              >
                {ATTRIBUTE_SLOTS.map(slot => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
                <option value="none">no slot</option>
              </Select>
            </Field>

            <Field label="Provenance">
              <Select
                value={formSource}
                onChange={event => setFormSource(event.target.value as DictionaryRule['source'])}
                aria-label="Provenance"
              >
                {SOURCE_OPTIONS.map(source => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </Select>
            </Field>

            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              icon={<Plus size={16} weight="regular" />}
            >
              {saving ? 'Adding' : 'Add rule'}
            </Button>
          </div>

          {formError ? <p className="mt-3 text-[12.5px] text-negative">{formError}</p> : null}

          {added && !formError ? (
            <motion.p
              key={`${added.token}-${added.expansion}`}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="mt-3 max-w-[76ch] text-[12.5px] leading-relaxed text-ink-2"
            >
              <Mono>{added.token}</Mono> now expands to{' '}
              <span className="text-ink">{added.expansion}</span>
              {added.slot ? (
                <>
                  {' '}
                  and fills the <span className="text-ink">{added.slot}</span> slot
                </>
              ) : (
                ' and contributes its words without claiming a slot'
              )}
              . The instrument above has already re-run with it in effect.
            </motion.p>
          ) : null}
        </form>

        <div className="flex flex-wrap items-center gap-3 border-b border-rule px-5 py-3">
          <div className="relative w-full max-w-[320px]">
            <MagnifyingGlass
              size={16}
              weight="regular"
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <TextInput
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Filter by short form, meaning or slot"
              className="pl-8"
              aria-label="Filter dictionary rules"
            />
          </div>
          {rules ? (
            <span className="text-[12px] text-ink-3">
              <Num size="xs">{filtered.length}</Num> of <Num size="xs">{rules.length}</Num> shown
            </span>
          ) : null}
        </div>

        {dictError ? (
          <div className="px-5 py-4">
            <ErrorState message={dictError} onRetry={() => setAttempt(value => value + 1)} />
          </div>
        ) : !rules ? (
          <div className="px-5 py-4">
            <Skeleton rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-4">
            <EmptyState
              title="No rule matches that"
              detail="Nothing in the dictionary contains that text. If the short form belongs here, add it with the form above."
              action={
                <Button size="sm" onClick={() => setSearch('')}>
                  Clear the filter
                </Button>
              }
            />
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Short form</Th>
                  <Th>Expands to</Th>
                  <Th>Slot</Th>
                  <Th>Source</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ rule, added: isAdded }, index) => (
                  <tr
                    key={`${rule.token}-${rule.expansion}-${rule.source}-${index}`}
                    className={isAdded ? 'bg-accent-bg' : undefined}
                  >
                    <Td>
                      <span className="flex flex-wrap items-center gap-2">
                        <Num size="sm">{rule.token}</Num>
                        {isAdded ? <Chip tone="accent">added here</Chip> : null}
                      </span>
                    </Td>
                    <Td className="text-ink">{rule.expansion}</Td>
                    <Td>
                      {rule.slot ? (
                        <span className="font-mono text-[12px] text-ink-2">{rule.slot}</span>
                      ) : (
                        <span className="text-[12.5px] text-ink-3">no slot</span>
                      )}
                    </Td>
                    <Td>
                      <span className="font-mono text-[12px] text-ink-3">{rule.source}</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Panel>
    </div>
  )
}
