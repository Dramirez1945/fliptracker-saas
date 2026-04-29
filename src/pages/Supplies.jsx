import { useState } from 'react';
import { useApp } from '../App';
import { supplyRemaining, supplyValueRemaining } from '../storage';
import { SUPPLY_CATEGORIES, SUPPLY_UNITS } from '../constants';
import { showToast } from '../components/ui/Toast';
import PageHeader from '../components/layout/PageHeader';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

export default function Supplies() {
  const { supplies, allocs, saveSupplies, saveAllocs } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [deletePrompt, setDeletePrompt] = useState(null); // { supply, remQty, remVal }

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [totalQty, setTotalQty] = useState('');
  const [unit, setUnit] = useState('oz');
  const [totalCost, setTotalCost] = useState('');
  const [store, setStore] = useState('');
  const [notes, setNotes] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));

  function resetForm() {
    setName(''); setBrand(''); setCategory(''); setTotalQty('');
    setUnit('oz'); setTotalCost(''); setStore(''); setNotes('');
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setEditingId(null);
  }

  function openEdit(supply) {
    setName(supply.name);
    setBrand(supply.brand || '');
    setCategory(supply.category || '');
    setTotalQty(String(supply.totalQty));
    setUnit(supply.unit || 'oz');
    setTotalCost(String(supply.totalCost));
    setStore(supply.store || '');
    setNotes(supply.notes || '');
    setPurchaseDate(supply.purchaseDate || new Date().toISOString().slice(0, 10));
    setEditingId(supply.id);
    setShowAdd(true);
  }

  function handleSave() {
    if (!name || !totalQty || !totalCost) {
      showToast('Name, quantity and cost are required', 'error');
      return;
    }
    const record = {
      id: editingId || Date.now().toString(),
      name, brand, category,
      totalQty: parseFloat(totalQty),
      unit,
      totalCost: parseFloat(totalCost),
      purchaseDate,
      store,
      notes,
    };
    if (editingId) {
      saveSupplies(supplies.map(s => s.id === editingId ? record : s));
      showToast('Supply updated!');
    } else {
      saveSupplies([...supplies, record]);
      showToast('Supply added!');
    }
    resetForm();
    setShowAdd(false);
  }

  function handleDeleteClick(supply) {
    const remQty = supplyRemaining(supply, allocs);
    const remVal = supplyValueRemaining(supply, allocs);
    if (remQty <= 0) {
      saveSupplies(supplies.filter(s => s.id !== supply.id));
      showToast('Supply deleted.');
    } else {
      setDeletePrompt({ supply, remQty, remVal });
    }
  }

  function handleWriteOff() {
    saveSupplies(supplies.filter(s => s.id !== deletePrompt.supply.id));
    setDeletePrompt(null);
    showToast('Supply written off.');
  }

  function handleSplitAcrossItems() {
    const { supply, remVal } = deletePrompt;
    const supplyAllocs = allocs.filter(a => a.supplyId === supply.id);
    const totalAllocQty = supplyAllocs.reduce((sum, a) => sum + a.qtyUsed, 0);

    const updatedAllocs = allocs.map(a => {
      if (a.supplyId !== supply.id || totalAllocQty === 0) return a;
      const share = a.qtyUsed / totalAllocQty;
      return { ...a, costAllocated: a.costAllocated + share * remVal };
    });

    saveAllocs(updatedAllocs);
    saveSupplies(supplies.filter(s => s.id !== supply.id));
    setDeletePrompt(null);
    showToast('Remainder split across items. Supply deleted.');
  }

  const totalSpent = supplies.reduce((s, sup) => s + sup.totalCost, 0);
  const totalAllocated = allocs.reduce((s, a) => s + a.costAllocated, 0);
  const totalPool = supplies.reduce((s, sup) => s + supplyValueRemaining(sup, allocs), 0);

  const byCategory = SUPPLY_CATEGORIES.reduce((acc, cat) => {
    const items = supplies.filter(s => s.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});
  const uncategorized = supplies.filter(s => !s.category || !SUPPLY_CATEGORIES.includes(s.category));
  if (uncategorized.length > 0) byCategory['Other'] = [...(byCategory['Other'] || []), ...uncategorized];

  const costPerUnit = (s) => s.totalQty > 0 ? s.totalCost / s.totalQty : 0;

  return (
    <>
      <PageHeader title="Supplies" />

      <div className="page-scroll">
        <div style={{ padding: '16px 16px 0' }}>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <StatCard label="Total Spent" value={`$${totalSpent.toFixed(0)}`} />
            <StatCard label="Allocated" value={`$${totalAllocated.toFixed(0)}`} valueColor="var(--sienna)" />
            <StatCard label="In Pool" value={`$${totalPool.toFixed(0)}`} valueColor="var(--sage)" />
            <StatCard label="Products" value={supplies.length} />
          </div>

          {/* Supply list by category */}
          {Object.entries(byCategory).map(([cat, items]) => (
            <section key={cat} style={{ marginBottom: 16 }}>
              <button
                onClick={() => setCollapsed(c => ({ ...c, [cat]: !c[cat] }))}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  marginBottom: 8, padding: 0,
                }}
              >
                <div className="label-caps">{cat}</div>
                <span style={{ color: 'var(--dust)', fontSize: 14 }}>{collapsed[cat] ? '▶' : '▼'}</span>
              </button>

              {!collapsed[cat] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map(supply => {
                    const rem = supplyRemaining(supply, allocs);
                    const remVal = supplyValueRemaining(supply, allocs);
                    const pctRem = supply.totalQty > 0 ? (rem / supply.totalQty) * 100 : 0;
                    const barColor = pctRem > 50 ? 'var(--sage)' : pctRem > 20 ? 'var(--gold)' : 'var(--sienna)';

                    return (
                      <div key={supply.id} className="card" style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>
                              {supply.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--dust)' }}>
                              {supply.brand} · {supply.store && `${supply.store} · `}
                              {new Date(supply.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sage)' }}>
                              ${remVal.toFixed(2)}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--dust)' }}>
                              {rem.toFixed(1)} {supply.unit} left
                            </div>
                          </div>
                        </div>

                        <div className="progress-bar" style={{ marginBottom: 8 }}>
                          <div className="progress-bar-fill" style={{ width: `${Math.min(100, pctRem)}%`, background: barColor }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Badge variant="default">{supply.category || 'Uncategorized'}</Badge>
                          <span style={{ fontSize: 12, color: 'var(--dust)' }}>
                            ${costPerUnit(supply).toFixed(2)} / {supply.unit}
                          </span>
                        </div>

                        {supply.notes && (
                          <div style={{ fontSize: 12, color: 'var(--dust)', marginTop: 6, fontStyle: 'italic' }}>
                            {supply.notes}
                          </div>
                        )}

                        {/* Edit / Delete row */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <button
                            onClick={() => openEdit(supply)}
                            style={{
                              flex: 1, padding: '7px 0', borderRadius: 8,
                              border: '1.5px solid var(--sand)', background: '#fff',
                              color: 'var(--bark)', fontSize: 13, fontWeight: 600,
                              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(supply)}
                            style={{
                              flex: 1, padding: '7px 0', borderRadius: 8,
                              border: '1.5px solid var(--sienna)', background: '#fff',
                              color: 'var(--sienna)', fontSize: 13, fontWeight: 600,
                              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}

          {supplies.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--dust)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🪣</div>
              <p>No supplies yet. Add your first one!</p>
            </div>
          )}

          {/* Add / Edit Supply form */}
          {showAdd && (
            <div className="card fade-up" style={{ padding: 16, marginTop: 16, marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 16, color: 'var(--charcoal)' }}>
                {editingId ? 'Edit Supply' : 'Add Supply'}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input label="Supply name" placeholder="Sage Green Chalk Paint" value={name} onChange={e => setName(e.target.value)} />
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
                    <Input label="Total qty" type="number" inputMode="decimal" placeholder="32" value={totalQty} onChange={e => setTotalQty(e.target.value)} />
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
                  <Input label="Total cost" type="number" inputMode="decimal" prefix="$" placeholder="0.00" value={totalCost} onChange={e => setTotalCost(e.target.value)} />
                  {totalQty && totalCost && (
                    <div style={{ fontSize: 12, color: 'var(--sage)', marginTop: 4, fontWeight: 600 }}>
                      ≈ ${(parseFloat(totalCost) / parseFloat(totalQty)).toFixed(2)} per {unit}
                    </div>
                  )}
                </div>

                <Input label="Where purchased (optional)" placeholder="Lowe's, Home Depot…" value={store} onChange={e => setStore(e.target.value)} />
                <Input label="Batch notes (optional)" placeholder="Slightly darker shade…" value={notes} onChange={e => setNotes(e.target.value)} />
                <Input label="Purchase date" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <Button variant="secondary" style={{ flex: 1 }} onClick={() => { setShowAdd(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button style={{ flex: 1 }} onClick={handleSave}>
                    {editingId ? 'Save Changes' : 'Add Supply'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div style={{ height: 20 }} />
        </div>
      </div>

      {/* FAB */}
      {!showAdd && (
        <button
          onClick={() => { resetForm(); setShowAdd(true); }}
          style={{
            position: 'fixed',
            bottom: 76,
            right: 'max(16px, calc(50% - 199px))',
            width: 52, height: 52,
            borderRadius: 26,
            background: 'var(--sienna)',
            color: '#fff',
            fontSize: 26,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(184,97,42,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Sans', sans-serif",
            zIndex: 90,
          }}
        >
          +
        </button>
      )}

      {/* Delete prompt modal */}
      {deletePrompt && (
        <div
          onClick={() => setDeletePrompt(null)}
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
              Delete Supply
            </div>
            <div style={{ fontSize: 14, color: 'var(--bark)', marginBottom: 20 }}>
              <strong>${deletePrompt.remVal.toFixed(2)}</strong> of {deletePrompt.supply.name} is unallocated.
              What would you like to do?
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleWriteOff}
                style={{
                  padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                  border: '1.5px solid var(--sand)', background: '#fff',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 2 }}>Write it off</div>
                <div style={{ fontSize: 12, color: 'var(--dust)' }}>
                  Delete the supply. Existing item costs stay exactly as-is. The remainder is treated as a loss.
                </div>
              </button>

              <button
                onClick={handleSplitAcrossItems}
                style={{
                  padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                  border: '1.5px solid var(--sage)', background: '#fff',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 2 }}>Split across items</div>
                <div style={{ fontSize: 12, color: 'var(--dust)' }}>
                  Redistribute the ${deletePrompt.remVal.toFixed(2)} remainder proportionally to all items that used this supply.
                </div>
              </button>

              <Button variant="secondary" onClick={() => setDeletePrompt(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
