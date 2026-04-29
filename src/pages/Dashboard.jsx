import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { itemTrueCost, itemSupplyCost, supplyValueRemaining } from '../storage';
import { CATEGORIES } from '../constants';
import PageHeader from '../components/layout/PageHeader';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

function fmt(n) { return '$' + (n || 0).toFixed(0); }
function fmtD(n) { return '$' + (n || 0).toFixed(2); }

export default function Dashboard() {
  const navigate = useNavigate();
  const { items, allocs, supplies } = useApp();

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const active = items.filter(i => i.status !== 'sold');
  const sold   = items.filter(i => i.status === 'sold');
  const needsFinishing = items.filter(i => i.status === 'acquired');
  const listed = items.filter(i => i.status === 'listed');

  const revenue = sold.reduce((s, i) => s + (i.soldPrice || 0), 0);
  const trueProfit = sold.reduce((s, i) => s + (i.soldPrice || 0) - itemTrueCost(i, allocs), 0);

  const topSupplies = [...supplies]
    .sort((a, b) => supplyValueRemaining(b, allocs) - supplyValueRemaining(a, allocs))
    .slice(0, 3);

  const isEmpty = items.length === 0;

  function catLabel(id) {
    return CATEGORIES.find(c => c.id === id)?.label || id;
  }
  function catIcon(id) {
    return CATEGORIES.find(c => c.id === id)?.icon || '✦';
  }

  return (
    <>
      <PageHeader
        title="The Shop"
        subtitle={today}
        right={
          <Button size="sm" variant="primary" onClick={() => navigate('/add')}>
            + New Find
          </Button>
        }
      />

      <div className="page-scroll">
        <div style={{ padding: '16px 16px 0' }}>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <StatCard label="In Stock" value={active.length} />
            <StatCard label="Revenue" value={fmt(revenue)} valueColor="var(--sage)" />
            <StatCard label="True Profit" value={fmt(trueProfit)} valueColor="var(--sage)" />
          </div>

          {isEmpty ? (
            <div className="card fade-up" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛋️</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 8, color: 'var(--charcoal)' }}>
                No finds yet
              </h2>
              <p style={{ color: 'var(--dust)', fontSize: 14, marginBottom: 20 }}>
                Log your first thrift find to start tracking inventory & profit.
              </p>
              <Button size="full" onClick={() => navigate('/add')}>
                Log your first find →
              </Button>
            </div>
          ) : (
            <>
              {/* Needs Finishing */}
              {needsFinishing.length > 0 && (
                <section style={{ marginBottom: 24 }}>
                  <div className="label-caps" style={{ marginBottom: 10 }}>Needs Finishing</div>
                  <div
                    style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}
                    className="hide-scrollbar"
                  >
                    {needsFinishing.map((item, i) => (
                      <div
                        key={item.id}
                        className="card"
                        onClick={() => navigate(`/item/${item.id}`)}
                        style={{
                          flexShrink: 0,
                          width: 150,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          animation: `fadeUp 0.3s ease ${i * 0.04}s both`,
                        }}
                      >
                        {item.photoBefore ? (
                          <img
                            src={item.photoBefore}
                            style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                          />
                        ) : (
                          <div style={{
                            width: '100%', height: 100, background: 'var(--cream)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 32,
                          }}>
                            {catIcon(item.category)}
                          </div>
                        )}
                        <div style={{ padding: '8px 10px 10px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 2 }}>
                            {catLabel(item.category)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--dust)', marginBottom: 4 }}>
                            {item.storeChain}{item.storeArea ? ` — ${item.storeArea}` : ''}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sienna)' }}>
                            ${item.cost}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Listed on Marketplace */}
              {listed.length > 0 && (
                <section style={{ marginBottom: 24 }}>
                  <div className="label-caps" style={{ marginBottom: 10 }}>Listed on Marketplace</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {listed.map((item, i) => {
                      const trueCost = itemTrueCost(item, allocs);
                      const estProfit = (item.listingPrice || 0) - trueCost;
                      return (
                        <div
                          key={item.id}
                          className="card"
                          onClick={() => navigate(`/item/${item.id}`)}
                          style={{
                            display: 'flex', gap: 12, padding: 12, cursor: 'pointer',
                            animation: `fadeUp 0.3s ease ${i * 0.05}s both`,
                          }}
                        >
                          {item.photoAfter || item.photoBefore ? (
                            <img
                              src={item.photoAfter || item.photoBefore}
                              style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{
                              width: 64, height: 64, borderRadius: 10, background: 'var(--cream)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 24, flexShrink: 0,
                            }}>
                              {catIcon(item.category)}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 3 }}>
                              {item.aiTitle || catLabel(item.category)}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--bark)', marginBottom: 6 }}>
                              Listed at ${item.listingPrice}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 600 }}>
                              Est. profit: ${estProfit.toFixed(0)}
                            </div>
                          </div>
                          <Badge variant="listed">Listed</Badge>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Supply Pool glance */}
              {topSupplies.length > 0 && (
                <section style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div className="label-caps">Supply Pool</div>
                    <button
                      onClick={() => navigate('/supplies')}
                      style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--sienna)', cursor: 'pointer', fontWeight: 600 }}
                    >
                      View all →
                    </button>
                  </div>
                  <div className="card" style={{ overflow: 'hidden' }}>
                    {topSupplies.map((supply, i) => {
                      const rem = supplyValueRemaining(supply, allocs);
                      const pct = supply.totalQty > 0
                        ? Math.round((rem / (supply.totalCost / supply.totalQty) / supply.totalQty) * 100)
                        : 0;
                      const barColor = pct > 50 ? 'var(--sage)' : pct > 20 ? 'var(--gold)' : 'var(--sienna)';
                      return (
                        <div key={supply.id}>
                          {i > 0 && <hr className="divider" />}
                          <div style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{supply.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--dust)' }}>{supply.brand} · {new Date(supply.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sage)', textAlign: 'right' }}>
                                ${rem.toFixed(2)}
                              </div>
                            </div>
                            <div className="progress-bar">
                              <div className="progress-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: barColor }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
