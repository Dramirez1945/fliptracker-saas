import { useLocation, useNavigate } from 'react-router-dom';
import { useTierContext } from '../../context/TierContext';

const tabs = [
  { path: '/',        icon: '⊞',  label: 'Home' },
  { path: '/inventory', icon: '🗂', label: 'Inventory' },
  { path: '/supplies',  icon: '🪣', label: 'Supplies' },
  { path: '/sales',     icon: '📈', label: 'Sales' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tier, aiGensUsed, itemsCreated } = useTierContext();

  const active = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      background: 'rgba(253,250,245,0.95)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderTop: '1.5px solid var(--sand)',
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100,
    }}>
      {/* TEMP dev scaffolding — remove in Phase 3 */}
      <div style={{ fontSize: '11px', color: 'var(--dust)', padding: '4px 8px', textAlign: 'center' }}>
        Tier: {tier} | Items: {itemsCreated} | AI: {aiGensUsed}
      </div>
      <div style={{ display: 'flex' }}>
      {tabs.map(tab => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            padding: '10px 0 8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: active(tab.path) ? 'var(--sienna)' : 'var(--dust)',
            transition: 'color 0.15s',
          }}
        >
          <span style={{ fontSize: 20 }}>{tab.icon}</span>
          <span style={{
            fontSize: 10,
            fontWeight: active(tab.path) ? 600 : 400,
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: 0.2,
          }}>
            {tab.label}
          </span>
          {active(tab.path) && (
            <span style={{
              position: 'absolute',
              bottom: 0,
              width: 24,
              height: 2.5,
              background: 'var(--sienna)',
              borderRadius: '2px 2px 0 0',
            }} />
          )}
        </button>
      ))}
      </div>
    </nav>
  );
}
