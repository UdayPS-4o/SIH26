import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, User } from 'lucide-react'

const QA_PAIRS = [
  {
    q: /what.*mastitis|mastitis.*what/i,
    a: "Mastitis is an inflammation of the udder, usually caused by bacterial infection. It reduces milk quality and quantity. Our AI detects it early by monitoring SCC levels, activity changes, and temperature — often 2-3 days before visible symptoms.",
  },
  {
    q: /how.*detect|detection.*work|how.*work/i,
    a: "We use IoT sensors (SCC monitors, smart collars, temperature probes) that feed data every 30 seconds. Our ML model analyzes 6+ parameters — SCC, milk yield change, activity, rumination, temperature, and humidity — to calculate a real-time risk score.",
  },
  {
    q: /alert|notification|sms/i,
    a: "Alerts are sent via SMS, IVR call, or push notification based on the farmer's preference. Even farmers without smartphones receive audio alerts. High-risk alerts trigger immediate notification to the farmer and vet.",
  },
  {
    q: /herd|how many|animals/i,
    a: "The system monitors your entire herd. Currently tracking 47 animals across 3 sheds. Each animal has an individual risk profile updated every 30 seconds with live sensor data.",
  },
  {
    q: /prevent|prevention|avoid/i,
    a: "Prevention is the core of our system. By detecting risk 48-72 hours before clinical symptoms, farmers can take preventive action — adjusting feed, improving hygiene, or administering early treatment. The Simulator page lets you test preventive scenarios.",
  },
  {
    q: /sensor|iot|device/i,
    a: "We use SCC sensors on milk lines, smart collars with accelerometers for activity tracking, and environmental sensors for temperature and humidity. All sensors sync via a local gateway and the data is processed on our AI engine.",
  },
  {
    q: /cost|price|pricing|subsidy/i,
    a: "Gaurogya-Setu is designed to be affordable for small and marginal farmers. Government subsidy schemes under the National Animal Disease Control Programme may cover sensor costs. Contact your local dairy cooperative for pricing details.",
  },
  {
    q: /language|hindi|english/i,
    a: "The interface supports both English and Hindi. More regional languages are being added. The SMS notifications are also available in the farmer's preferred language.",
  },
]

function getBotReply(userMsg) {
  const matched = QA_PAIRS.find((pair) => pair.q.test(userMsg))
  if (matched) return matched.a
  return "That's a great question! Our AI assistant can help with mastitis detection, alerts, sensor info, herd management, and prevention tips. Try asking about mastitis symptoms, how detection works, or alert notifications."
}

export default function AiChatAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! I'm your Gaurogya-Setu AI assistant. Ask me anything about mastitis, alerts, or herd management." },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, thinking])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const send = () => {
    const text = input.trim()
    if (!text) return
    setMessages((m) => [...m, { from: 'user', text }])
    setInput('')
    setThinking(true)
    setTimeout(() => {
      setThinking(false)
      setMessages((m) => [...m, { from: 'bot', text: getBotReply(text) }])
    }, 1200 + Math.random() * 800)
  }

  return (
    <>
      {/* Toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 grid h-12 w-12 place-items-center rounded-full bg-forest-600 text-white shadow-lg hover:bg-forest-700 active:scale-95 transition"
          aria-label="AI Assistant"
        >
          <MessageSquare size={20} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[460px] w-[340px] flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-2xl dark:border-barn-700 dark:bg-barn-900 sm:w-[360px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-sand-200 bg-forest-600 px-4 py-3 dark:border-barn-700">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-white" />
              <span className="text-sm font-semibold text-white">AI Assistant</span>
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse-soft" />
            </div>
            <button
              onClick={() => setOpen(false)}
              className="grid h-7 w-7 place-items-center rounded-lg text-white/80 hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.from === 'user' ? 'flex-row-reverse' : ''}`}>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs ${
                  m.from === 'user' ? 'bg-honey-100 text-honey-700 dark:bg-honey-900/40 dark:text-honey-300' : 'bg-forest-100 text-forest-700 dark:bg-forest-900/40 dark:text-forest-300'
                }`}>
                  {m.from === 'user' ? <User size={13} /> : <Bot size={13} />}
                </span>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  m.from === 'user'
                    ? 'bg-forest-600 text-white rounded-br-sm'
                    : 'bg-sand-100 text-sand-800 dark:bg-barn-800 dark:text-sand-200 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700 dark:bg-forest-900/40 dark:text-forest-300">
                  <Bot size={13} />
                </span>
                <div className="rounded-2xl rounded-bl-sm bg-sand-100 px-3 py-2.5 dark:bg-barn-800">
                  <AiThinkingDots />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-sand-200 p-2 dark:border-barn-700">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask about mastitis, alerts..."
              className="flex-1 rounded-xl border border-sand-200 bg-sand-50 px-3 py-2 text-xs outline-none focus:border-forest-400 dark:border-barn-700 dark:bg-barn-800 dark:text-sand-100"
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest-600 text-white hover:bg-forest-700 disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
