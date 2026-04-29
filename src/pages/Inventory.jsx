import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { itemTrueCost } from '../storage';
import { CATEGORIES } from '../constants';
import PageHeader from '../components/layout/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

function catLabel(id) { return CATEGORIES.find(c => c.id === id)?.label || id; }
function catIcon(id)  { return CATEGORIES.find(c => c.id === id)?.icon  || '✦'; }

export default function Inventory() {
  const navigate = useNavigate();
  const { items, allocs } = useApp();
  const [filter, setFilter] = useState('all');

  const tabs = [
    { id: 'all',      label: 'All' },
    { id: 'acquired', label: 'Acquired' },
    { id: 'listed',   label: 'Listed' },
    { id: 'sold',     label: 'Sold' },
  ];

  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);
  const sorted = [...filtered].sort((a, b) => b.id - a.id);

  return (
    <>
      <PageHeader
        title="Inventory"
        right={<Button size="sm" onClick={() => navigate('/add')}>+ Add</Button>}
      />

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 6, padding: '12px 16px',
        overflowX: 'auto', background: 'var(--warm-white)',
        borderBottom: '1.5px solid var(--sand)',
      }} className="hide-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            style={{
              flexShrink: 0,
              padding: '6px 14px',
              borderRadius: 99,
              border: '1.5px solid',
              borderColor: filter === t.id ? 'var(--sienna)' : 'var(--sand)',
              background: filter === t.id ? 'var(--sienna-pale)' : '#fff',
              color: filter === t.id ? 'var(--sienna)' : 'var(--bark)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="page-scroll">
        <div style={{ padding: '12px 16px' }}>
          {sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--dust)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🗂</div>
              <p>No items {filter !== 'all' ? `with status "${filter}"` : ''}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sorted.map((item, i) => {
                const trueCost = itemTrueCost(item, allocs);
                const photo = item.photoAfter || item.photoBefore;
                return (
                  <div
                    key={item.id}
                    className="card"
                    onClick={() => navigate(`/item/${item.id}`)}
                    style={{
                      display: 'flex', gap: 12, padding: 12, cursor: 'pointer',
                      animation: `fadeUp 0.25s ease ${i * 0.03}s both`,
                    }}
                  >
                    {photo ? (
                      <img src={photo} style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{
                        width: 60, height: 60, borderRadius: 10, background: 'var(--cream)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, flexShrink: 0,
                      }}>
                        {catIcon(item.category)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>
                          {catLabel(item.category)}
                        </div>
                        <Badge variant={item.status}>{item.status}</Badge>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--dust)', marginBottom: 4 }}>{item.storeChain}{item.storeArea ? ` — ${item.storeArea}` : ''}</div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                        <span style={{ color: 'var(--bark)' }}>Paid <strong>${item.cost}</strong></span>
                        {item.status === 'sold' && (
                          <span style={{ color: 'var(--sage)', fontWeight: 600 }}>
                            Profit ${(item.soldPrice - trueCost).toFixed(0)}
                          </span>
                        )}
                        {item.status === 'listed' && (
                          <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
                            Listed ${item.listingPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
