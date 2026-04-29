import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import PageHeader from '../components/layout/PageHeader';
import StatCard from '../components/ui/StatCard';

export default function ArchivedSupplies() {
  const navigate = useNavigate();
  const { supplies } = useApp();

  const archived = supplies
    .filter(s => s.status === 'depleted')
    .sort((a, b) => (b.purchaseDate || '').localeCompare(a.purchaseDate || ''));

  const totalSpent = archived.reduce((s, sup) => s + sup.totalCost, 0);
  const totalQty = archived.reduce((s, sup) => s + sup.totalQty, 0);

  return (
    <>
      <PageHeader title="Archived Supplies" back />

      <div className="page-scroll">
        <div style={{ padding: '16px 16px 0' }}>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <StatCard label="Total Spent" value={`$${totalSpent.toFixed(0)}`} />
            <StatCard label="Products" value={archived.length} />
          </div>

          {archived.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--dust)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
              <p>No archived supplies yet.</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Supplies appear here when fully used up.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {archived.map(supply => {
              const costPerUnit = supply.totalQty > 0 ? supply.totalCost / supply.totalQty : 0;
              return (
                <div
                  key={supply.id}
                  className="card"
                  onClick={() => navigate(`/supplies/archived/${supply.id}`)}
                  style={{ padding: '14px 16px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--charcoal)' }}>
                        {supply.name}
                      </div>
                      {supply.brand && (
                        <div style={{ fontSize: 12, color: 'var(--dust)' }}>{supply.brand}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--sienna)' }}>
                          ${supply.totalCost.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--dust)' }}>total spent</div>
                      </div>
                      <span style={{ color: 'var(--dust)', fontSize: 18 }}>›</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12, color: 'var(--bark)' }}>
                      <span style={{ fontWeight: 600 }}>{supply.totalQty} {supply.unit}</span>
                      {' '}total used
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--bark)' }}>
                      <span style={{ fontWeight: 600 }}>${costPerUnit.toFixed(2)}</span>
                      {' '}per {supply.unit}
                    </div>
                    {supply.store && (
                      <div style={{ fontSize: 12, color: 'var(--dust)' }}>{supply.store}</div>
                    )}
                    {supply.purchaseDate && (
                      <div style={{ fontSize: 12, color: 'var(--dust)' }}>
                        {new Date(supply.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ height: 24 }} />
        </div>
      </div>
    </>
  );
}
