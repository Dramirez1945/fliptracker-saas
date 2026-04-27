export default function StatCard({ label, value, valueColor, sub }) {
  return (
    <div className="card" style={{ padding: '14px 12px', textAlign: 'center', flex: 1 }}>
      <div className="label-caps" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontWeight: 700,
        fontSize: 22,
        color: valueColor || 'var(--charcoal)',
        lineHeight: 1.1,
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--dust)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
