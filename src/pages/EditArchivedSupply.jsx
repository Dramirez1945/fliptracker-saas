import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../App';
import { SUPPLY_CATEGORIES, SUPPLY_UNITS } from '../constants';
import { showToast } from '../components/ui/Toast';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function EditArchivedSupply() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { supplies, saveSupplies } = useApp();

  const supply = supplies.find(s => s.id === id && s.status === 'depleted');

  const [name, setName] = useState(() => supply?.name || '');
  const [brand, setBrand] = useState(() => supply?.brand || '');
  const [category, setCategory] = useState(() => supply?.category || '');
  const [totalQty, setTotalQty] = useState(() => supply ? String(supply.totalQty) : '');
  const [unit, setUnit] = useState(() => supply?.unit || 'oz');
  const [totalCost, setTotalCost] = useState(() => supply ? String(supply.totalCost) : '');
  const [store, setStore] = useState(() => supply?.store || '');
  const [notes, setNotes] = useState(() => supply?.notes || '');
  const [purchaseDate, setPurchaseDate] = useState(() => supply?.purchaseDate || new Date().toISOString().slice(0, 10));
  const [consolidatePrompt, setConsolidatePrompt] = useState(null); // { activeMatch, returning }

  if (!supply) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--dust)' }}>Supply not found.</div>;

  function buildRecord() {
    return {
      ...supply,
      name: name.trim(),
      brand: brand.trim(),
      category,
      totalQty: parseFloat(totalQty) || supply.totalQty,
      unit,
      totalCost: parseFloat(totalCost) || supply.totalCost,
      store: store.trim(),
      notes: notes.trim(),
      purchaseDate,
    };
  }

  function handleSaveChanges() {
    if (!name.trim() || !totalQty || !totalCost) {
      showToast('Name, quantity and cost are required', 'error');
      return;
    }
    saveSupplies(supplies.map(s => s.id === id ? buildRecord() : s));
    showToast('Archive record updated.');
    navigate('/supplies/archived');
  }

  function handleReturnToStock() {
    if (!name.trim() || !totalQty || !totalCost) {
      showToast('Name, quantity and cost are required', 'error');
      return;
    }
    const returning = { ...buildRecord(), status: 'active' };

    const nameLower = returning.name.toLowerCase();
    const brandLower = returning.brand.toLowerCase();
    const activeSupplies = supplies.filter(s => (s.status || 'active') === 'active');
    const activeMatch = activeSupplies.find(s => {
      const sName = s.name.trim().toLowerCase();
      const sBrand = (s.brand || '').trim().toLowerCase();
      if (sName !== nameLower) return false;
      if (!brandLower && !sBrand) return true;
      return brandLower === sBrand;
    });

    if (activeMatch) {
      setConsolidatePrompt({ activeMatch, returning });
    } else {
      saveSupplies(supplies.map(s => s.id === id ? returning : s));
      showToast('Supply returned to active stock.');
      navigate('/supplies');
    }
  }

  function handleMerge() {
    const { activeMatch, returning } = consolidatePrompt;
    const merged = {
      ...activeMatch,
      totalQty: activeMatch.totalQty + returning.totalQty,
      totalCost: activeMatch.totalCost + returning.totalCost,
      purchaseDate: [activeMatch.purchaseDate, returning.purchaseDate]
        .filter(Boolean).sort().pop(),
    };
    saveSupplies(
      supplies
        .filter(s => s.id !== returning.id)
        .map(s => s.id === activeMatch.id ? merged : s)
    );
    setConsolidatePrompt(null);
    showToast('Merged into active stock.');
    navigate('/supplies');
  }

  function handleDeletePermanently() {
    if (!confirm('This will permanently delete this supply and cannot be undone. Are you sure?')) return;
    saveSupplies(supplies.filter(s => s.id !== id));
    showToast('Supply permanently deleted.');
    navigate('/supplies/archived');
  }

  function handleKeepSeparate() {
    const { returning } = consolidatePrompt;
    saveSupplies(supplies.map(s => s.id === returning.id ? returning : s));
    setConsolidatePrompt(null);
    showToast('Restored as separate active supply.');
    navigate('/supplies');
  }

  return (
    <>
      <PageHeader title="Edit Archived Supply" back />

      <div className="page-scroll">
        <div style={{ padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          <Input label="Supply name" value={name} onChange={e => setName(e.target.value)} />
          <Input label="Brand" placeholder="Rust-Oleum, Annie Sloan…" value={brand} onChange={e => setBrand(e.target.value)} />

          <div>
            <div className="label-caps" style={{ marginBottom: 8 }}>Category</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUPPLY_CATEGORIES.map(cat => {
                const sel = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    style={{
                      padding: '6px 12px', borderRadius: 99,
                      border: '1.5px solid',
                      borderColor: sel ? 'var(--sienna)' : 'var(--sand)',
                      background: sel ? 'var(--sienna-pale)' : '#fff',
                      color: sel ? 'var(--sienna)' : 'var(--bark)',
                      fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <Input label="Total qty" type="number" inputMode="decimal" value={totalQty} onChange={e => setTotalQty(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--bark)', marginBottom: 6 }}>Unit</div>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                style={{
                  width: '100%', padding: '12px 13px', borderRadius: 12,
                  border: '1.5px solid var(--sand)', background: '#fff',
                  fontSize: 15, fontFamily: "'DM Sans', sans-serif",
                  color: 'var(--charcoal)', outline: 'none',
                }}
              >
                {SUPPLY_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Input label="Total cost" type="number" inputMode="decimal" prefix="$" value={totalCost} onChange={e => setTotalCost(e.target.value)} />
            {totalQty && totalCost && (
              <div style={{ fontSize: 12, color: 'var(--sage)', marginTop: 4, fontWeight: 600 }}>
                ≈ ${(parseFloat(totalCost) / parseFloat(totalQty)).toFixed(2)} per {unit}
              </div>
            )}
          </div>

          <Input label="Where purchased (optional)" placeholder="Lowe's, Home Depot…" value={store} onChange={e => setStore(e.target.value)} />
          <Input label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
          <Input label="Date" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <Button size="full" onClick={handleSaveChanges}>
              Save Changes
            </Button>
            <Button size="full" variant="secondary" onClick={handleReturnToStock}>
              Return to Stock
            </Button>
            <button
              onClick={handleDeletePermanently}
              style={{
                width: '100%', marginTop: 6, padding: '12px 0',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: '#B91C1C', fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Delete Permanently
            </button>
          </div>

        </div>
      </div>

      {/* Return-to-stock consolidation prompt */}
      {consolidatePrompt && (
        <div
          onClick={() => setConsolidatePrompt(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            zIndex: 200, padding: '0 0 env(safe-area-inset-bottom)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card"
            style={{ width: '100%', maxWidth: 430, borderRadius: '20px 20px 0 0', padding: 24, paddingBottom: 32 }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 8 }}>
              Active Supply Found
            </div>
            <div style={{ fontSize: 14, color: 'var(--bark)', marginBottom: 16 }}>
              You already have an active supply with this name. Merge or keep separate?
            </div>

            <div style={{ background: 'var(--cream)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--dust)' }}>
              <div style={{ fontWeight: 600, color: 'var(--charcoal)', marginBottom: 4 }}>
                {consolidatePrompt.activeMatch.name}{consolidatePrompt.activeMatch.brand ? ` · ${consolidatePrompt.activeMatch.brand}` : ''}
              </div>
              <div>Active: {consolidatePrompt.activeMatch.totalQty} {consolidatePrompt.activeMatch.unit} · ${consolidatePrompt.activeMatch.totalCost.toFixed(2)}</div>
              <div>Returning: {consolidatePrompt.returning.totalQty} {consolidatePrompt.returning.unit} · ${consolidatePrompt.returning.totalCost.toFixed(2)}</div>
              <div style={{ marginTop: 4, fontWeight: 600, color: 'var(--sienna)' }}>
                Combined: {consolidatePrompt.activeMatch.totalQty + consolidatePrompt.returning.totalQty} {consolidatePrompt.activeMatch.unit} · ${(consolidatePrompt.activeMatch.totalCost + consolidatePrompt.returning.totalCost).toFixed(2)}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleMerge}
                style={{
                  padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                  border: '1.5px solid var(--sage)', background: '#fff',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 2 }}>Yes, merge</div>
                <div style={{ fontSize: 12, color: 'var(--dust)' }}>
                  Add to existing active stock. Cost-per-unit recalculates automatically.
                </div>
              </button>

              <button
                onClick={handleKeepSeparate}
                style={{
                  padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                  border: '1.5px solid var(--sand)', background: '#fff',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 2 }}>Keep separate</div>
                <div style={{ fontSize: 12, color: 'var(--dust)' }}>
                  Restore as its own active line item.
                </div>
              </button>

              <Button variant="secondary" onClick={() => setConsolidatePrompt(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
