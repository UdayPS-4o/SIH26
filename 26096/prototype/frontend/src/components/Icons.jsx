// Lightweight inline SVG icon set — stroke-based, inherits currentColor.

const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function Icon({ name, size = 22, className = '' }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', className, ...S, xmlns: 'http://www.w3.org/2000/svg' };
  switch (name) {
    case 'home':
      return (
        <svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></svg>
      );
    case 'chat':
      return (
        <svg {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z" /><path d="M8.5 11h7M8.5 14h4" /></svg>
      );
    case 'timeline':
      return (
        <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
      );
    case 'manuscript':
      return (
        <svg {...p}><path d="M5 4h9l5 5v11H5z" /><path d="M14 4v5h5" /><path d="M8 13h7M8 16.5h7" /></svg>
      );
    case 'speech':
      return (
        <svg {...p}><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M6 11a6 6 0 0 0 12 0" /><path d="M12 17v4M9 21h6" /></svg>
      );
    case 'book':
      return (
        <svg {...p}><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v16H7.5A2.5 2.5 0 0 0 5 20.5Z" /><path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H19v4H7.5A2.5 2.5 0 0 1 5 20.5Z" /></svg>
      );
    case 'media':
      return (
        <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m10 9.5 5 2.5-5 2.5z" /></svg>
      );
    case 'person':
      return (
        <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
      );
    case 'info':
      return (
        <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
      );
    case 'search':
      return (
        <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      );
    case 'sparkles':
      return (
        <svg {...p}><path d="M12 3.5 13.7 9 19 10.7 13.7 12.4 12 18l-1.7-5.6L5 10.7 10.3 9z" /><path d="M18.5 4.5 19 6l1.5.5L19 7l-.5 1.5L18 7l-1.5-.5L18 6z" /></svg>
      );
    case 'sun':
      return (
        <svg {...p}><circle cx="12" cy="12" r="4.2" /><path d="M12 3v2M12 19v2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M3 12h2M19 12h2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5" /></svg>
      );
    case 'moon':
      return (
        <svg {...p}><path d="M20 13.5A8 8 0 0 1 10.5 4a7 7 0 1 0 9.5 9.5Z" /></svg>
      );
    case 'menu':
      return (
        <svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      );
    case 'globe':
      return (
        <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.7 3 2.7 15 0 18M12 3c-2.7 3-2.7 15 0 18" /></svg>
      );
    case 'chevron-down':
      return (
        <svg {...p}><path d="m6 9 6 6 6-6" /></svg>
      );
    case 'arrow-right':
      return (
        <svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      );
    case 'play':
      return (
        <svg {...p}><circle cx="12" cy="12" r="9" /><path d="m10 8.5 6 3.5-6 3.5z" /></svg>
      );
    case 'quote':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path d="M9.5 5C6.5 6.4 4.6 9.3 4.6 12.9V19h6v-6H7.7c0-2.3 1.1-4 3-4.9L9.5 5Zm9 0c-3 1.4-4.9 4.3-4.9 7.9V19h6v-6h-2.9c0-2.3 1.1-4 3-4.9L18.5 5Z" />
        </svg>
      );
    case 'doc':
      return (
        <svg {...p}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /></svg>
      );
    case 'image':
      return (
        <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.7" /><path d="m4 17 5-5 4 3 3-2 4 4" /></svg>
      );
    case 'download':
      return (
        <svg {...p}><path d="M12 4v11M8 11l4 4 4-4" /><path d="M5 19h14" /></svg>
      );
    case 'external':
      return (
        <svg {...p}><path d="M14 4h6v6M20 4l-8 8" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
      );
    default:
      return null;
  }
}

export default Icon;
