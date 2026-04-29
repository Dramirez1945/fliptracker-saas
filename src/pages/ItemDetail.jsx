import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../App';
import { itemTrueCost, itemSupplyCost, itemTrueProfit, supplyRemaining } from '../storage';
import { CATEGORIES, QUALITY_TIERS } from '../constants';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { showToast } from '../components/ui/Toast';

function catLabel(id) { return CATEGORIES.find(c => c.id === id)?.label || id; }
function catIcon(id)  { return CATEGORIES.find(c => c.id === id)?.icon  || '✦'; }

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, allocs, supplies, saveItems, saveAllocs } = useApp();

  const item = items.find(i => i.id === id);
  if (!item) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--dust)' }}>Item not found.</div>;

  // Initialise pctMap from existing allocs for this item
  const existingAllocs = allocs.filter(a => a.itemId === id);
  const [pctMap, setPctMap] = useState(() =>
    existingAllocs.reduce((m, a) => ({ ...m, [a.supplyId]: a.pctUsed }), {})
  );
  const [supplyOpen, setSupplyOpen] = useState(false);

  const trueCost = itemTrueCost(item, allocs);
  const supplyCost = itemSupplyCost(item.id, allocs);
  const estProfit = item.status === 'listed'
    ? (item.listingPrice || 0) - trueCost
    : item.status === 'sold'
    ? itemTrueProfit(item, allocs)
    : null;

  const tierLabel = QUALITY_TIERS.find(t => t.id === item.qualityTier)?.label;

  // Supplies to show: active (has remaining) + any already allocated to this item
  const allocatedSupplyIds = new Set(existingAllocs.map(a => a.supplyId));
  const visibleSupplies = supplies.filter(s =>
    supplyRemaining(s, allocs) > 0 || allocatedSupplyIds.has(s.id)
  );

  function calcAlloc(supply, pct) {
    const qtyUsed = (supply.totalQty * pct) / 100;
    const costPerUnit = supply.totalCost / supply.totalQty;
    return { qtyUsed, costAllocated: qtyUsed * costPerUnit };
  }

  const pendingSupplyCost = visibleSupplies.reduce((sum, s) => {
    const pct = parseFloat(pctMap[s.id]) || 0;
    return pct > 0 ? sum + calcAlloc(s, pct).costAllocated : sum;
  }, 0);

  function saveAllocations() {
    const otherAllocs = allocs.filter(a => a.itemId !== id);
    const newAllocs = visibleSupplies
      .filter(s => parseFloat(pctMap[s.id]) > 0)
      .map(s => {
        const pct = parseFloat(pctMap[s.id]);
        const { qtyUsed, costAllocated } = calcAlloc(s, pct);
        return {
          id: `${id}-${s.id}`,
          itemId: id,
          supplyId: s.id,
          pctUsed: pct,
          qtyUsed,
          costAllocated,
          date: new Date().toISOString(),
        };
      });
    saveAllocs([...otherAllocs, ...newAllocs]);
    showToast('Supply allocations saved.');
  }

  function handleDelete() {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    saveItems(items.filter(i => i.id !== id));
    showToast('Item deleted');
    navigate('/inventory');
  }

  return (
    <>
      <PageHeader
        title={catLabel(item.category)}
        back
        right={<Badge variant={item.status}>{item.status}</Badge>}
      />

      <div className="page-scroll">
        <div style={{ padding: '16px 16px 24px' }}>

          {/* Photos */}
          {item.photoBefore || item.photoAfter ? (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {item.photoBefore && (
                <div style={{ flex: 1 }}>
                  <div className="label-caps" style={{ marginBottom: 4, textAlign: 'center' }}>Before</div>
                  <img src={item.photoBefore} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 12 }} />
                </div>
              )}
              {item.photoAfter && (
                <div style={{ flex: 1 }}>
                  <div className="label-caps" style={{ marginBottom: 4, textAlign: 'center' }}>After</div>
                  <img src={item.photoAfter} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 12 }} />
                </div>
              )}
            </div>
          ) : (
            <div style={{
              height: 120, background: 'var(--cream)', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 48, marginBottom: 16,
            }}>
              {catIcon(item.category)}
            </div>
          )}

          {/* Cost Breakdown */}
          <div className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div className="label-caps" style={{ marginBottom: 12 }}>Cost Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: 'var(--dust)' }}>Paid at store</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>${item.cost.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: 'var(--dust)' }}>Supplies used</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>${supplyCost.toFixed(2)}</span>
              </div>
              <hr className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--charcoal)' }}>True Cost</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: 'var(--sienna)' }}>
                  ${trueCost.toFixed(2)}
                </span>
              </div>
              {item.listingPrice > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: 'var(--dust)' }}>Listed at</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold)' }}>${item.listingPrice.toFixed(0)}</span>
                </div>
              )}
              {item.status === 'sold' && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: 'var(--dust)' }}>Sold for</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--sage)' }}>${item.soldPrice.toFixed(0)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profit */}
          {estProfit !== null && (
            <div className="card" style={{
              padding: 16, marginBottom: 12,
              background: item.status === 'sold' ? 'var(--sage-light)' : 'var(--gold-light)',
              borderColor: item.status === 'sold' ? '#C5D9B5' : '#E8D0A0',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: item.status === 'sold' ? 'var(--sage)' : 'var(--gold)' }}>
                  {item.status === 'sold' ? 'True Profit' : 'Est. Profit if sold at listing price'}
                </span>
                <span style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22, fontWeight: 700,
                  color: item.status === 'sold' ? 'var(--sage)' : 'var(--gold)',
                }}>
                  ${estProfit.toFixed(0)}
                </span>
              </div>
              {item.status === 'sold' && item.soldPrice > 0 && (
                <div style={{ fontSize: 12, color: 'var(--sage)', marginTop: 4 }}>
                  ROI: {((estProfit / trueCost) * 100).toFixed(0)}%
                </div>
              )}
            </div>
          )}

          {/* Supply allocation — interactive, always available */}
          <div className="card" style={{ marginBottom: 12, overflow: 'hidden' }}>
            <button
              onClick={() => setSupplyOpen(o => !o)}
              style={{
                width: '100%', padding: '14px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>Supplies Used</div>
                <div style={{ fontSize: 11, color: 'var(--dust)' }}>
                  {existingAllocs.length > 0 ? `${existingAllocs.length} supply allocated` : 'tap to add'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {supplyCost > 0 && (
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sienna)' }}>
                    ${supplyCost.toFixed(2)}
                  </span>
                )}
                <span style={{ color: 'var(--dust)', fontSize: 18 }}>{supplyOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {supplyOpen && (
              <div style={{ borderTop: '1.5px solid var(--sand)' }}>
                {visibleSupplies.length === 0 ? (
                  <div style={{ padding: 16, fontSize: 13, color: 'var(--dust)', textAlign: 'center' }}>
                    No supplies available. Add some in the Supplies tab.
                  </div>
                ) : (
                  visibleSupplies.map((supply, i) => {
                    const pct = parseFloat(pctMap[supply.id]) || 0;
                    const { qtyUsed, costAllocated } = pct > 0 ? calcAlloc(supply, pct) : { qtyUsed: 0, costAllocated: 0 };
                    const rem = supplyRemaining(supply, allocs);
                    return (
                      <div key={supply.id}>
                        {i > 0 && <hr className="divider" />}
                        <div style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>
                                {supply.name}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--dust)' }}>
                                {supply.brand} · {rem.toFixed(1)} {supply.unit} remaining
                              </div>
                            </div>
                            {pct > 0 && (
                              <div style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 600, textAlign: 'right' }}>
                                {qtyUsed.toFixed(1)} {supply.unit}<br />
                                ${costAllocated.toFixed(2)}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input
                              type="number"
                              min="0" max="100" step="1"
                              value={pctMap[supply.id] ?? ''}
                              onChange={e => setPctMap(m => ({ ...m, [supply.id]: e.target.value }))}
                              placeholder="0"
                              style={{
                                width: 70, padding: '8px 12px', borderRadius: 10,
                                border: '1.5px solid var(--sand)', fontSize: 15,
                                fontFamily: "'DM Sans', sans-serif", color: 'var(--charcoal)',
                                textAlign: 'center',
                              }}
                            />
                            <span style={{ fontSize: 13, color: 'var(--dust)' }}>% used</span>
                            {pct > 0 && (
                              <span style={{ fontSize: 12, color: 'var(--bark)' }}>
                                = ${costAllocated.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {visibleSupplies.length > 0 && (
                  <div style={{
                    padding: '12px 16px',
                    borderTop: '1.5px solid var(--sand)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'var(--cream)',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>
                      Total: ${pendingSupplyCost.toFixed(2)}
                    </span>
                    <button
                      onClick={saveAllocations}
                      style={{
                        padding: '8px 20px', borderRadius: 10,
                        background: 'var(--sienna)', color: '#fff',
                        border: 'none', fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Meta info */}
          <div className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div className="label-caps" style={{ marginBottom: 12 }}>Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Source', `${item.storeChain}${item.storeArea ? ' — ' + item.storeArea : ''}`],
                ['Condition', item.condition],
                tierLabel && ['Quality tier', tierLabel],
                item.notes && ['Notes', item.notes],
                ['Acquired', item.acquiredDate ? new Date(item.acquiredDate).toLocaleDateString() : '—'],
                item.listedDate && ['Listed', new Date(item.listedDate).toLocaleDateString()],
                item.soldDate && ['Sold', new Date(item.soldDate).toLocaleDateString()],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--dust)' }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--charcoal)', textAlign: 'right', flex: 1 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Listing preview */}
          {item.aiTitle && (
            <div className="card" style={{ padding: 16, marginBottom: 12, background: 'var(--cream)' }}>
              <div className="label-caps" style={{ marginBottom: 8 }}>AI Listing Draft</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                {item.aiTitle}
              </div>
              <div style={{ fontSize: 13, color: 'var(--bark)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {item.aiDescription?.slice(0, 200)}{item.aiDescription?.length > 200 ? '…' : ''}
              </div>
              <button
                onClick={() => navigate(`/item/${id}/listing`)}
                style={{ background: 'none', border: 'none', color: 'var(--sienna)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8, padding: 0 }}
              >
                Edit listing →
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {item.status === 'acquired' && (
              <Button size="full" onClick={() => navigate(`/item/${id}/finish`)}>
                Mark as Finished & Ready to List →
              </Button>
            )}
            {item.status === 'listed' && (
              <>
                <Button size="full" variant="sage" onClick={() => navigate(`/item/${id}/sold`)}>
                  💰 Record Sale
                </Button>
                {!item.aiTitle && (
                  <Button size="full" variant="secondary" onClick={() => navigate(`/item/${id}/listing`)}>
                    ✦ Generate AI Listing
                  </Button>
                )}
                {item.aiTitle && (
                  <Button size="full" variant="secondary" onClick={() => navigate(`/item/${id}/listing`)}>
                    View / Edit AI Listing
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={handleDelete}
            style={{
              width: '100%', marginTop: 20, padding: '12px 0',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: '#B91C1C', fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Delete item
          </button>
        </div>
      </div>
    </>
  );
}
