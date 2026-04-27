export default function Badge({ children, variant = 'default' }) {
  const variants = {
    default:  { background: 'var(--cream)',      color: 'var(--bark)',    border: '1px solid var(--sand)' },
    sienna:   { background: 'var(--sienna-pale)', color: 'var(--sienna)', border: '1px solid #E8C4A8' },
    sage:     { background: 'var(--sage-light)',  color: 'var(--sage)',   border: '1px solid #C5D9B5' },
    gold:     { background: 'var(--gold-light)',  color: 'var(--gold)',   border: '1px solid #E8D0A0' },
    acquired: { background: '#FFF7ED',            color: '#C2410C',       border: '1px solid #FED7AA' },
    listed:   { background: 'var(--gold-light)',  color: 'var(--gold)',   border: '1px solid #E8D0A0' },
    sold:     { background: 'var(--sage-light)',  color: 'var(--sage)',   border: '1px solid #C5D9B5' },
  };

  const v = variants[variant] || variants.default;

  return (
    <span style={{
      display: 'inline-block',
      fontSize: 11,
      fontWeight: 600,
      padding: '3px 8px',
      borderRadius: 99,
      ...v,
    }}>
      {children}
    </span>
  );
}
