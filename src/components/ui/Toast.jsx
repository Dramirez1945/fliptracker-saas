import { useState, useEffect } from 'react';

let toastQueue = [];
let listeners = [];

export function showToast(message, type = 'success') {
  const id = Date.now();
  toastQueue = [...toastQueue, { id, message, type }];
  listeners.forEach(fn => fn([...toastQueue]));
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    listeners.forEach(fn => fn([...toastQueue]));
  }, 3000);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const fn = (t) => setToasts(t);
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 90,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 9999,
      width: 'calc(100% - 32px)',
      maxWidth: 398,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '12px 16px',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 500,
          color: '#fff',
          background: t.type === 'error' ? '#B91C1C' : t.type === 'info' ? 'var(--bark)' : 'var(--sage)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          animation: 'fadeUp 0.25s ease both',
          textAlign: 'center',
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
