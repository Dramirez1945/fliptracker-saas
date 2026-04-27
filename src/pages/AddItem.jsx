import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { CATEGORIES, STORE_CHAINS, CONDITIONS } from '../constants';
import { showToast } from '../components/ui/Toast';
import PageHeader from '../components/layout/PageHeader';
import PhotoBox from '../components/ui/PhotoBox';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const TOTAL_STEPS = 4;

export default function AddItem() {
  const navigate = useNavigate();
  const { saveItems, items, savedStores, saveSavedStores } = useApp();
  const [step, setStep] = useState(1);

  const [category, setCategory] = useState('');
  const [storeChain, setStoreChain] = useState('');
  const [storeArea, setStoreArea] = useState('');
  const [photoBefore, setPhotoBefore] = useState(null);
  const [condition, setCondition] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  function next() { setStep(s => Math.min(s + 1, TOTAL_STEPS)); }
  function back() { if (step === 1) navigate(-1); else setStep(s => s - 1); }

  function handleSubmit() {
    const id = Date.now().toString();
    const newItem = {
      id,
      category,
      condition,
      cost: parseFloat(cost) || 0,
      storeChain,
      storeArea,
      notes,
      photoBefore: photoBefore || null,
      photoAfter: null,
      qualityTier: '',
      listingPrice: 0,
      soldPrice: 0,
      acquiredDate: new Date().toISOString(),
      listedDate: '',
      soldDate: '',
      status: 'acquired',
      aiTitle: '',
      aiDescription: '',
      aiSuggestedPrice: 0,
    };

    // Save store area for autocomplete
    if (storeChain && storeArea) {
      const current = savedStores.find(s => s.chain === storeChain);
      if (current) {
        const areas = Array.from(new Set([storeArea, ...current.areas]));
        saveSavedStores(savedStores.map(s => s.chain === storeChain ? { ...s, areas } : s));
      } else {
        saveSavedStores([...savedStores, { chain: storeChain, areas: [storeArea] }]);
      }
    }

    saveItems([...items, newItem]);
    showToast('Item added to inventory!');
    navigate(`/item/${id}`);
  }

  function PillSelector({ options, value, onSelect }) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => {
          const sel = opt === value;
          return (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              style={{
                padding: '8px 14px',
                borderRadius: 99,
                border: '1.5px solid',
                borderColor: sel ? 'var(--sienna)' : 'var(--sand)',
                background: sel ? 'var(--sienna-pale)' : '#fff',
                color: sel ? 'var(--sienna)' : 'var(--bark)',
                fontSize: 13,
                fontWeight: sel ? 600 : 400,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.15s',
                textAlign: 'left',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  const stepsValid = {
    1: !!category,
    2: !!storeChain,
    3: !!condition && cost !== '',
    4: true,
  };

  return (
    <>
      <PageHeader
        title={`Step ${step} of ${TOTAL_STEPS}`}
        back
        right={
          <div style={{ display: 'flex', gap: 6 }}>
            {[1,2,3,4].map(n => (
              <div key={n} style={{
                width: n <= step ? 20 : 8,
                height: 4,
                borderRadius: 99,
                background: n <= step ? 'var(--sienna)' : 'var(--sand)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
        }
      />

      <div className="page-scroll">
        <div style={{ padding: '20px 16px' }}>

          {/* Step 1 — Category */}
          {step === 1 && (
            <div className="fade-up">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 6, color: 'var(--charcoal)' }}>
                What is it?
              </h2>
              <p style={{ color: 'var(--dust)', fontSize: 14, marginBottom: 20 }}>Choose the type of furniture</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
                {CATEGORIES.map(cat => {
                  const sel = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      style={{
                        padding: '16px 12px',
                        borderRadius: 14,
                        border: '1.5px solid',
                        borderColor: sel ? 'var(--sienna)' : 'var(--sand)',
                        background: sel ? 'var(--sienna-pale)' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontFamily: "'DM Sans', sans-serif",
                        transition: 'all 0.15s',
                        boxShadow: sel ? '0 0 0 1px var(--sienna)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{cat.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: sel ? 'var(--sienna)' : 'var(--charcoal)' }}>
                        {cat.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2 — Store */}
          {step === 2 && (
            <div className="fade-up">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 6 }}>Where'd you find it?</h2>
              <p style={{ color: 'var(--dust)', fontSize: 14, marginBottom: 20 }}>Select the store</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {STORE_CHAINS.map(chain => {
                  const sel = storeChain === chain;
                  const saved = savedStores.find(s => s.chain === chain);
                  return (
                    <button
                      key={chain}
                      onClick={() => setStoreChain(chain)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: '1.5px solid',
                        borderColor: sel ? 'var(--sienna)' : 'var(--sand)',
                        background: sel ? 'var(--sienna-pale)' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: sel ? 'var(--sienna)' : 'var(--charcoal)' }}>{chain}</div>
                      {saved?.areas?.length > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--dust)', marginTop: 3 }}>
                          {saved.areas.slice(0, 2).join(' · ')}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {storeChain && (
                <Input
                  label="Location / area"
                  placeholder="e.g. Chandler · McClintock"
                  value={storeArea}
                  onChange={e => setStoreArea(e.target.value)}
                  hint="Saves for next time"
                />
              )}
            </div>
          )}

          {/* Step 3 — Photo + Details */}
          {step === 3 && (
            <div className="fade-up">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 6 }}>Before photo & details</h2>
              <p style={{ color: 'var(--dust)', fontSize: 14, marginBottom: 20 }}>Snap the before shot</p>

              <div style={{ marginBottom: 20 }}>
                <PhotoBox value={photoBefore} onChange={setPhotoBefore} label="Before photo" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div className="label-caps" style={{ marginBottom: 10 }}>Condition</div>
                <PillSelector options={CONDITIONS} value={condition} onSelect={setCondition} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <Input
                  label="What you paid"
                  type="number"
                  inputMode="decimal"
                  prefix="$"
                  placeholder="0.00"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              <Input
                label="Notes (optional)"
                placeholder="Any details about this piece…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* Step 4 — Review */}
          {step === 4 && (
            <div className="fade-up">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 6 }}>Looks good?</h2>
              <p style={{ color: 'var(--dust)', fontSize: 14, marginBottom: 20 }}>Review before adding</p>

              <div className="card" style={{ padding: 16, marginBottom: 24 }}>
                {photoBefore && (
                  <img src={photoBefore} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, marginBottom: 14 }} />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['Category', CATEGORIES.find(c => c.id === category)?.label],
                    ['Store', `${storeChain}${storeArea ? ' — ' + storeArea : ''}`],
                    ['Condition', condition],
                    ['Paid', cost ? `$${parseFloat(cost).toFixed(2)}` : '—'],
                    notes && ['Notes', notes],
                  ].filter(Boolean).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontSize: 13, color: 'var(--dust)' }}>{k}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', textAlign: 'right' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10 }}>
            {step > 1 && (
              <Button variant="secondary" size="md" onClick={back} style={{ flex: 1 }}>
                Back
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              <Button
                size="md"
                onClick={next}
                disabled={!stepsValid[step]}
                style={{ flex: 1 }}
              >
                Continue →
              </Button>
            ) : (
              <Button size="md" onClick={handleSubmit} style={{ flex: 1 }}>
                Add to Inventory ✓
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
