import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../App';
import { QUALITY_TIERS } from '../constants';
import { showToast } from '../components/ui/Toast';
import PageHeader from '../components/layout/PageHeader';
import PhotoBox from '../components/ui/PhotoBox';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function FinishItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, saveItems } = useApp();

  const item = items.find(i => i.id === id);
  if (!item) return null;

  const [photoAfter, setPhotoAfter] = useState(item.photoAfter || null);
  const [qualityTier, setQualityTier] = useState(item.qualityTier || '');
  const [listingPrice, setListingPrice] = useState(item.listingPrice ? String(item.listingPrice) : '');

  function handleConfirm() {
    if (!qualityTier || !listingPrice) {
      showToast('Please set quality tier and listing price', 'error');
      return;
    }

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
          <div style={{ marginBottom: 24 }}>
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

          <Button size="full" onClick={handleConfirm}>
            Confirm & Mark Listed ✓
          </Button>
        </div>
      </div>
    </>
  );
}
