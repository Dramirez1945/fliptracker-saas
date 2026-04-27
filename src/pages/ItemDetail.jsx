import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../App';
import { itemTrueCost, itemSupplyCost, itemTrueProfit } from '../storage';
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
  const { items, allocs, supplies, saveItems } = useApp();

  const item = items.find(i => i.id === id);
  if (!item) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--dust)' }}>Item not found.</div>;

  const trueCost = itemTrueCost(item, allocs);
  const supplyCost = itemSupplyCost(item.id, allocs);
  const estProfit = item.status === 'listed'
    ? (item.listingPrice || 0) - trueCost
    : item.status === 'sold'
    ? itemTrueProfit(item, allocs)
    : null;

  const itemAllocs = allocs.filter(a => a.itemId === id);
  const tierLabel = QUALITY_TIERS.find(t => t.id === item.qualityTier)?.label;

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

          {/* Meta info */}
          <div className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div className="label-caps" style={{ marginBottom: 12 }}>Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Source', `${item.storeChain}${item.storeArea ? ' · ' + item.storeArea : ''}`],
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

          {/* Supply allocations */}
          {itemAllocs.length > 0 && (
            <div className="card" style={{ padding: 16, marginBottom: 12 }}>
              <div className="label-caps" style={{ marginBottom: 12 }}>Supplies Used</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {itemAllocs.map(alloc => {
                  const supply = supplies.find(s => s.id === alloc.supplyId);
                  if (!supply) return null;
                  return (
                    <div key={alloc.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{supply.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--dust)' }}>{alloc.pctUsed}% used · {alloc.qtyUsed.toFixed(1)} {supply.unit}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sienna)' }}>
                        ${alloc.costAllocated.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
