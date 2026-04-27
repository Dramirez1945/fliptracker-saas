import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../App';
import { itemTrueCost } from '../storage';
import { CATEGORIES } from '../constants';
import { showToast } from '../components/ui/Toast';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

function catLabel(id) { return CATEGORIES.find(c => c.id === id)?.label || id; }

export default function MarkSold() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, allocs, saveItems } = useApp();

  const item = items.find(i => i.id === id);
  if (!item) return null;

  const [soldPrice, setSoldPrice] = useState('');
  const trueCost = itemTrueCost(item, allocs);
  const saleAmt = parseFloat(soldPrice) || 0;
  const profit = saleAmt - trueCost;
  const roi = trueCost > 0 ? (profit / trueCost) * 100 : 0;

  function handleConfirm() {
    if (!soldPrice || saleAmt <= 0) {
      showToast('Enter the sale price', 'error');
      return;
    }
    saveItems(items.map(i => i.id === id ? {
      ...i,
      soldPrice: saleAmt,
      soldDate: new Date().toISOString(),
      status: 'sold',
    } : i));
    showToast('Sale recorded!');
    navigate(`/item/${id}`);
  }

  return (
    <>
      <PageHeader title="Record Sale" back />

      <div className="page-scroll">
        <div style={{ padding: '20px 16px 32px' }}>

          {/* Item summary */}
          <div className="card" style={{ padding: 14, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
            {(item.photoAfter || item.photoBefore) ? (
              <img
                src={item.photoAfter || item.photoBefore}
                style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 10, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                ✦
              </div>
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--charcoal)' }}>{catLabel(item.category)}</div>
              <div style={{ fontSize: 13, color: 'var(--dust)' }}>{item.storeChain}</div>
              <div style={{ fontSize: 13, color: 'var(--bark)' }}>True cost: <strong>${trueCost.toFixed(2)}</strong></div>
            </div>
          </div>

          {/* Sale price input */}
          <div style={{ marginBottom: 24 }}>
            <Input
              label="Actual sale price"
              type="number"
              inputMode="decimal"
              prefix="$"
              placeholder="0"
              value={soldPrice}
              onChange={e => setSoldPrice(e.target.value)}
              min="0"
              autoFocus
            />
          </div>

          {/* Live profit calculation */}
          {saleAmt > 0 && (
            <div
              className="card fade-up"
              style={{
                padding: 20, marginBottom: 24,
                background: profit >= 0 ? 'var(--sage-light)' : '#FEE2E2',
                borderColor: profit >= 0 ? '#C5D9B5' : '#FECACA',
                textAlign: 'center',
              }}
            >
              <div className="label-caps" style={{ marginBottom: 8, color: profit >= 0 ? 'var(--sage)' : '#B91C1C' }}>
                True Profit
              </div>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 42,
                fontWeight: 900,
                color: profit >= 0 ? 'var(--sage)' : '#B91C1C',
                lineHeight: 1,
                marginBottom: 6,
              }}>
                {profit >= 0 ? '+' : ''}{profit < 0 ? '-' : ''}${Math.abs(profit).toFixed(2)}
              </div>
              <div style={{ fontSize: 14, color: profit >= 0 ? 'var(--sage)' : '#B91C1C', fontWeight: 600, marginBottom: 16 }}>
                {roi.toFixed(0)}% ROI
              </div>
              <hr className="divider" style={{ marginBottom: 14 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: profit >= 0 ? 'var(--sage)' : '#B91C1C' }}>
                <span>${saleAmt.toFixed(2)} sale</span>
                <span>− ${trueCost.toFixed(2)} cost</span>
                <span>= ${profit.toFixed(2)}</span>
              </div>
            </div>
          )}

          <Button size="full" onClick={handleConfirm}>
            Confirm Sale ✓
          </Button>
        </div>
      </div>
    </>
  );
}
