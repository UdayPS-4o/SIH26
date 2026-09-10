import { useState, useEffect, useRef } from 'react'

export default function Transition({ open, children, className }) {
  const [render, setRender] = useState(false)

  useEffect(() => {
    if (open) {
      setRender(true)
    } else {
      const t = setTimeout(() => setRender(false), 200)
      return () => clearTimeout(t)
    }
  }, [open])

  if (!render) return null

  return (
    <div
      className={className}
      style={{
        animation: open ? 'fadeIn 200ms ease forwards' : 'fadeOut 200ms ease forwards',
        opacity: open ? 1 : 0,
      }}
    >
      {children}
    </div>
  )
}

function cls(...args) {
  return args.filter(Boolean).join(' ')
}
