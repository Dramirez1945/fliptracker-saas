import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../App';
import { QUALITY_TIERS } from '../constants';
import { supplyRemaining } from '../storage';
import { showToast } from '../components/ui/Toast';
import PageHeader from '../components/layout/PageHeader';
import PhotoBox from '../components/ui/PhotoBox';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function FinishItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, supplies, allocs, saveItems, saveAllocs } = useApp();

  const item = items.find(i => i.id === id);
  if (!item) return null;

  const [photoAfter, setPhotoAfter] = useState(item.photoAfter || null);
  const [qualityTier, setQualityTier] = useState(item.qualityTier || '');
  const [listingPrice, setListingPrice] = useState(item.listingPrice ? String(item.listingPrice) : '');
  const [supplyOpen, setSupplyOpen] = useState(false);
  const [pctMap, setPctMap] = useState({});

  const activeSupplies = supplies.filter(s => supplyRemaining(s, allocs) > 0);

  function calcAlloc(supply, pct) {
    const qtyUsed = (supply.totalQty * pct) / 100;
    const costPerUnit = supply.totalCost / supply.totalQty;
    const costAllocated = qtyUsed * costPerUnit;
    return { qtyUsed, costAllocated };
  }

  const totalSupplyCost = activeSupplies.reduce((sum, s) => {
    const pct = parseFloat(pctMap[s.id]) || 0;
    if (!pct) return sum;
    return sum + calcAlloc(s, pct).costAllocated;
  }, 0);

  function handleConfirm() {
    if (!qualityTier || !listingPrice) {
      showToast('Please set quality tier and listing price', 'error');
      return;
    }

    // Remove old allocations for this item
    const otherAllocs = allocs.filter(a => a.itemId !== id);

    // Create new allocations
    const newAllocs = activeSupplies
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

    saveItems(items.map(i => i.id === id ? {
      ...i,
      photoAfter,
      qualityTier,
      listingPrice: parseFloat(listingPrice) || 0,
      listedDate: new Date().toISOString(),
      status: 'listed',
    } : i));

    showToast('Item marked as listed!');
    navigate(`/item/${id}`);
  }

  return (
    <>
      <PageHeader title="Finish & List" back />

      <div className="page-scroll">
        <div style={{ padding: '20px 16px 32px' }}>

          {/* After photo */}
          <div style={{ marginBottom: 20 }}>
            <div className="label-caps" style={{ marginBottom: 10 }}>After photo</div>
            <PhotoBox value={photoAfter} onChange={setPhotoAfter} label="After photo" />
          </div>

          {/* Quality tier */}
          <div style={{ marginBottom: 20 }}>
            <div className="label-caps" style={{ marginBottom: 10 }}>Quality Tier</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {QUALITY_TIERS.map(tier => {
                const sel = qualityTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setQualityTier(tier.id)}
                    style={{
                      flex: 1, padding: '12px 8px',
                      borderRadius: 12,
                      border: '1.5px solid',
                      borderColor: sel ? 'var(--sienna)' : 'var(--sand)',
                      background: sel ? 'var(--sienna-pale)' : '#fff',
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: sel ? 'var(--sienna)' : 'var(--charcoal)' }}>
                      {tier.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--dust)', marginTop: 2 }}>{tier.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Listing price */}
          <div style={{ marginBottom: 20 }}>
            <Input
              label="Listing price"
              type="number"
              inputMode="decimal"
              prefix="$"
              placeholder="0"
              value={listingPrice}
              onChange={e => setListingPrice(e.target.value)}
              min="0"
            />
          </div>

          {/* Supply allocation (collapsible) */}
          <div className="card" style={{ marginBottom: 24, overflow: 'hidden' }}>
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
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>Supply Allocation</div>
                <div style={{ fontSize: 11, color: 'var(--dust)' }}>optional</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {totalSupplyCost > 0 && (
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sienna)' }}>
                    ${totalSupplyCost.toFixed(2)}
                  </span>
                )}
                <span style={{ color: 'var(--dust)', fontSize: 18 }}>{supplyOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {supplyOpen && (
              <div style={{ borderTop: '1.5px solid var(--sand)' }}>
                {activeSupplies.length === 0 ? (
                  <div style={{ padding: '16px', fontSize: 13, color: 'var(--dust)', textAlign: 'center' }}>
                    No active supplies. Add some in the Supplies tab.
                  </div>
                ) : (
                  activeSupplies.map((supply, i) => {
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
                              value={pctMap[supply.id] || ''}
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
                                = {pct}% of {supply.totalQty}{supply.unit} = ${costAllocated.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {totalSupplyCost > 0 && (
                  <div style={{
                    padding: '12px 16px',
                    borderTop: '1.5px solid var(--sand)',
                    display: 'flex', justifyContent: 'space-between',
                    background: 'var(--cream)',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>Total supply cost</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--sienna)' }}>${totalSupplyCost.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button size="full" onClick={handleConfirm}>
            Confirm & Mark Listed ✓
          </Button>
        </div>
      </div>
    </>
  );
}
