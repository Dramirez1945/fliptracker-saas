export default function Input({ label, type = 'text', value, onChange, placeholder, prefix, suffix, hint, error, inputMode, min, max, step, style, rows, autoFocus }) {
  const inputStyle = {
    width: '100%',
    background: '#fff',
    border: `1.5px solid ${error ? '#FCA5A5' : 'var(--sand)'}`,
    borderRadius: 12,
    padding: prefix ? '12px 12px 12px 38px' : '12px 13px',
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 400,
    color: 'var(--charcoal)',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--bark)' }}>{label}</label>
      )}
      <div style={{ position: 'relative' }}>
        {prefix && (
          <span style={{
            position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
            fontSize: 15, color: 'var(--dust)', fontWeight: 500, pointerEvents: 'none',
          }}>
            {prefix}
          </span>
        )}
        {rows ? (
          <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            autoFocus={autoFocus}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, ...style }}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            inputMode={inputMode}
            min={min}
            max={max}
            step={step}
            autoFocus={autoFocus}
            style={{ ...inputStyle, paddingRight: suffix ? 40 : 13, ...style }}
            onFocus={e => { e.target.style.borderColor = 'var(--sienna-light)'; }}
            onBlur={e => { e.target.style.borderColor = error ? '#FCA5A5' : 'var(--sand)'; }}
          />
        )}
        {suffix && (
          <span style={{
            position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
            fontSize: 13, color: 'var(--dust)', pointerEvents: 'none',
          }}>
            {suffix}
          </span>
        )}
      </div>
      {hint && !error && <span style={{ fontSize: 12, color: 'var(--dust)' }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, color: '#B91C1C' }}>{error}</span>}
    </div>
  );
}
