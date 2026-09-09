import { useState, useEffect, useCallback } from 'react'
import { Heart, Activity, Brain } from 'lucide-react'

const STEPS = [
  {
    icon: Heart,
    title: 'Welcome to Gaurogya-Setu',
    description:
      'Your intelligent companion for livestock health management. Monitor your herd, get AI-powered insights, and prevent diseases before they spread.',
  },
  {
    icon: Activity,
    title: 'Monitor Your Herd',
    description:
      'Track activity, temperature, rumination, and milk quality in real-time. IoT sensors and smart collars feed live data so you never miss a warning sign.',
  },
  {
    icon: Brain,
    title: 'Get AI Predictions',
    description:
      'Our ML engine analyzes 6+ parameters to predict mastitis risk 48–72 hours before symptoms appear. Act early, save yields, protect your herd.',
  },
]

const TOUR_KEY = 'tour-completed'

export function OnboardingTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState('forward')
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY)
    if (done === 'true') return
    // Delay slightly so the app renders first
    const t = setTimeout(() => setVisible(true), 400)
    return () => clearTimeout(t)
  }, [])

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_KEY, 'true')
    setVisible(false)
  }, [])

  const goNext = () => {
    if (step < STEPS.length - 1) {
      setDirection('forward')
      setStep((s) => s + 1)
    } else {
      finish()
    }
  }

  const goBack = () => {
    if (step > 0) {
      setDirection('backward')
      setStep((s) => s - 1)
    }
  }

  // Animate slide index so CSS transition fires on change
  useEffect(() => {
    const t = setTimeout(() => setDisplayed(step), 40)
    return () => clearTimeout(t)
  }, [step])

  if (!visible) return null

  const current = STEPS[displayed]
  const Icon = current.icon
  const isLast = displayed === STEPS.length - 1
  const isFirst = displayed === 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding tour"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-sand-900/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={finish}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-2xl dark:border-barn-700 dark:bg-barn-900">
        {/* Decorative top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-forest-500 via-honey-500 to-forest-500" />

        <div className="p-6 sm:p-8">
          {/* Step content with transitions */}
          <div className="relative overflow-hidden" style={{ minHeight: 220 }}>
            {STEPS.map((s, i) => {
              const IconComp = s.icon
              const isActive = i === displayed
              // Fade + slide: active slides in, inactive slides out
              const translate = isActive
                ? direction === 'forward'
                  ? 'translate-x-0'
                  : 'translate-x-0'
                : direction === 'forward'
                  ? i < displayed
                    ? '-translate-x-6'
                    : 'translate-x-6'
                  : i < displayed
                    ? '-translate-x-6'
                    : 'translate-x-6'
              const opacity = isActive ? 'opacity-100' : 'opacity-0'
              const pointer = isActive ? '' : 'pointer-events-none'

              return (
                <div
                  key={i}
                  className={`absolute inset-0 flex flex-col items-center text-center transition-all duration-300 ease-out ${translate} ${opacity} ${pointer}`}
                >
                  {/* Icon circle */}
                  <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-forest-100 dark:bg-forest-900/50">
                    <IconComp
                      size={32}
                      className="text-forest-600 dark:text-forest-400"
                    />
                  </div>

                  <h3 className="mb-2 text-lg font-semibold text-sand-900 dark:text-sand-100">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-sand-600 dark:text-sand-400">
                    {s.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Progress dots */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > displayed ? 'forward' : 'backward')
                  setDisplayed(i)
                  setStep(i)
                }}
                aria-label={`Go to step ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === displayed
                    ? 'w-6 bg-honey-500'
                    : 'w-2 bg-sand-300 dark:bg-barn-700 hover:bg-sand-400'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-6 flex items-center justify-between">
            {isFirst ? (
              <span /> /* spacer */
            ) : (
              <button
                onClick={goBack}
                className="btn-ghost text-sm px-4 py-2 rounded-lg"
              >
                Back
              </button>
            )}

            <div className="flex gap-2">
              {!isLast && (
                <button
                  onClick={finish}
                  className="text-sm text-sand-500 hover:text-sand-700 dark:text-sand-400 dark:hover:text-sand-200 px-3 py-2 rounded-lg transition-colors"
                >
                  Skip
                </button>
              )}
              <button
                onClick={goNext}
                className="btn-primary text-sm px-5 py-2.5 rounded-lg shadow-warm"
              >
                {isLast ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingTour
