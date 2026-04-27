export default function PageWrapper({ children, style }) {
  return (
    <div className="page-scroll">
      <div style={{ padding: '0 16px', ...style }}>
        {children}
      </div>
    </div>
  );
}
