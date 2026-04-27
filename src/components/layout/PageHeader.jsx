import { useNavigate } from 'react-router-dom';

export default function PageHeader({ title, subtitle, back, right }) {
  const navigate = useNavigate();

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(253,250,245,0.95)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderBottom: '1.5px solid var(--sand)',
      padding: '0 16px',
      minHeight: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      {back && (
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, color: 'var(--bark)', padding: '4px 0',
            lineHeight: 1, flexShrink: 0,
          }}
        >
          ‹
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{
          fontFamily: back ? "'DM Sans', sans-serif" : "'Playfair Display', serif",
          fontWeight: back ? 600 : 700,
          fontSize: back ? 17 : 22,
          color: 'var(--charcoal)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.2,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 12, color: 'var(--dust)', marginTop: 1 }}>{subtitle}</p>
        )}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </header>
  );
}
