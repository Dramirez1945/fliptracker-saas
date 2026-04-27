export default function Button({ children, variant = 'primary', size = 'md', onClick, disabled, type = 'button', style, className = '' }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    transition: 'opacity 0.15s, transform 0.1s',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
  };

  const sizes = {
    sm: { fontSize: 13, padding: '8px 14px', borderRadius: 10 },
    md: { fontSize: 15, padding: '13px 20px', borderRadius: 12 },
    lg: { fontSize: 16, padding: '15px 24px', borderRadius: 14 },
    full: { fontSize: 16, padding: '15px 24px', borderRadius: 14, width: '100%' },
  };

  const variants = {
    primary: {
      background: 'var(--sienna)',
      color: '#fff',
    },
    secondary: {
      background: 'var(--cream)',
      border: '1.5px solid var(--sand)',
      color: 'var(--bark)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--sienna)',
    },
    danger: {
      background: '#FEE2E2',
      color: '#B91C1C',
      border: '1.5px solid #FECACA',
    },
    sage: {
      background: 'var(--sage-light)',
      color: 'var(--sage)',
      border: '1.5px solid #C5D9B5',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = ''; }}
      onTouchStart={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
      onTouchEnd={e => { e.currentTarget.style.transform = ''; }}
    >
      {children}
    </button>
  );
}
