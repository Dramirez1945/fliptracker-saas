import { useApp } from '../App';
import { itemTrueCost, itemTrueProfit } from '../storage';
import { CATEGORIES } from '../constants';
import PageHeader from '../components/layout/PageHeader';
import StatCard from '../components/ui/StatCard';

function catLabel(id) { return CATEGORIES.find(c => c.id === id)?.label || id; }
function catIcon(id)  { return CATEGORIES.find(c => c.id === id)?.icon  || '✦'; }

export default function SalesHistory() {
  const { items, allocs } = useApp();

  const sold = items
    .filter(i => i.status === 'sold')
    .sort((a, b) => new Date(b.soldDate) - new Date(a.soldDate));

  const revenue = sold.reduce((s, i) => s + (i.soldPrice || 0), 0);
  const trueProfit = sold.reduce((s, i) => s + itemTrueProfit(i, allocs), 0);
  const avgProfit = sold.length ? trueProfit / sold.length : 0;
  const avgROI = sold.length
    ? sold.reduce((s, i) => {
        const tc = itemTrueCost(i, allocs);
        return s + (tc > 0 ? ((itemTrueProfit(i, allocs) / tc) * 100) : 0);
      }, 0) / sold.length
    : 0;

  // Best source by ROI
  const storeROI = {};
  sold.forEach(item => {
    const chain = item.storeChain || 'Unknown';
    const tc = itemTrueCost(item, allocs);
    const roi = tc > 0 ? (itemTrueProfit(item, allocs) / tc) * 100 : 0;
    if (!storeROI[chain]) storeROI[chain] = { total: 0, count: 0 };
    storeROI[chain].total += roi;
    storeROI[chain].count += 1;
  });
  const bestSource = Object.entries(storeROI)
    .map(([chain, { total, count }]) => ({ chain, avg: total / count }))
    .sort((a, b) => b.avg - a.avg)[0];

  return (
    <>
      <PageHeader title="Sales History" />

      <div className="page-scroll">
        <div style={{ padding: '16px 16px 24px' }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            <StatCard label="Revenue" value={`$${revenue.toFixed(0)}`} valueColor="var(--sage)" />
            <StatCard label="True Profit" value={`$${trueProfit.toFixed(0)}`} valueColor="var(--sage)" />
            <StatCard label="Avg Profit" value={`$${avgProfit.toFixed(0)}`} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
            <StatCard label="Avg ROI" value={`${avgROI.toFixed(0)}%`} valueColor={avgROI > 0 ? 'var(--sage)' : 'var(--sienna)'} />
            <StatCard label="Pieces Sold" value={sold.length} />
            <StatCard
              label="Best Source"
              value={bestSource?.chain?.split(' ')[0] || '—'}
              sub={bestSource ? `${bestSource.avg.toFixed(0)}% ROI` : ''}
              valueColor="var(--gold)"
            />
          </div>

          {sold.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--dust)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
              <p>No sales recorded yet. Mark an item as sold to see it here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sold.map((item, i) => {
                const trueCost = itemTrueCost(item, allocs);
                const profit = itemTrueProfit(item, allocs);
                const roi = trueCost > 0 ? (profit / trueCost) * 100 : 0;
                const photo = item.photoAfter || item.photoBefore;

                return (
                  <div
                    key={item.id}
                    className="card"
                    style={{
                      padding: 14,
                      animation: `fadeUp 0.25s ease ${i * 0.04}s both`,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      {photo ? (
                        <img src={photo} style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 60, height: 60, borderRadius: 10, background: 'var(--cream)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 24, flexShrink: 0,
                        }}>
                          {catIcon(item.category)}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 2 }}>
                          {catLabel(item.category)}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--dust)', marginBottom: 4 }}>
                          {item.storeChain} · {item.soldDate ? new Date(item.soldDate).toLocaleDateString() : ''}
                        </div>
                        <div style={{
                          display: 'inline-block', fontSize: 11, fontWeight: 600,
                          background: 'var(--sage-light)', color: 'var(--sage)',
                          padding: '2px 8px', borderRadius: 99,
                        }}>
                          {roi.toFixed(0)}% ROI
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: 'var(--sage)' }}>
                          ${profit.toFixed(0)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--dust)' }}>profit</div>
                      </div>
                    </div>

                    <hr className="divider" style={{ marginBottom: 10 }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--dust)' }}>
                      <span>Paid <strong style={{ color: 'var(--bark)' }}>${item.cost}</strong></span>
                      <span>Supplies <strong style={{ color: 'var(--bark)' }}>${(trueCost - item.cost).toFixed(2)}</strong></span>
                      <span>Sold <strong style={{ color: 'var(--sage)' }}>${item.soldPrice}</strong></span>
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
