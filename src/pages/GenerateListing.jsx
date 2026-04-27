import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../App';
import { itemTrueCost } from '../storage';
import { CATEGORIES } from '../constants';
import { showToast } from '../components/ui/Toast';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';

function catLabel(id) { return CATEGORIES.find(c => c.id === id)?.label || id; }

export default function GenerateListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, allocs, saveItems } = useApp();

  const item = items.find(i => i.id === id);
  if (!item) return null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState(item.aiTitle || '');
  const [description, setDescription] = useState(item.aiDescription || '');
  const [suggestedPrice, setSuggestedPrice] = useState(item.aiSuggestedPrice || 0);
  const [generated, setGenerated] = useState(!!(item.aiTitle));
  const titleRef = useRef();
  const descRef = useRef();

  const trueCost = itemTrueCost(item, allocs);

  async function generate() {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      setError('No API key found. Add VITE_ANTHROPIC_API_KEY to your .env file.');
      return;
    }

    setLoading(true);
    setError('');

    const prompt = `You are helping write a Facebook Marketplace listing for a refurbished furniture piece.

Item details:
- Category: ${catLabel(item.category)}
- Quality tier: ${item.qualityTier}
- Condition when found: ${item.condition}
- Purchase price: $${item.cost}
- True cost (with supplies): $${trueCost.toFixed(2)}
- Notes: ${item.notes || 'none'}

Write:
1. A compelling Marketplace listing TITLE (max 80 chars). Format: [Adjective] [Item] | [Key Feature] | [Key Feature]
2. A suggested listing PRICE (number only, no $ sign) based on the quality tier and typical Phoenix AZ Marketplace prices for refurbished furniture
3. A full Marketplace DESCRIPTION with:
   - Opening hook line with an emoji
   - Bullet list of features (use em dash — not asterisks)
   - Material/build quality note
   - Styling suggestion (where it would look great)
   - Dimensions placeholder: "📐 Dimensions: [W x D x H]"
   - Payment/pickup line: cash, Venmo, Zelle, pickup only, Phoenix AZ
   - Closing line

Respond in this exact JSON format:
{
  "title": "...",
  "suggestedPrice": 000,
  "description": "..."
}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || `API error ${res.status}`);
      }

      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not parse AI response');

      const parsed = JSON.parse(jsonMatch[0]);
      setTitle(parsed.title || '');
      setSuggestedPrice(parsed.suggestedPrice || 0);
      setDescription(parsed.description || '');
      setGenerated(true);
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied!');
    } catch {
      showToast('Copy failed — try selecting manually', 'error');
    }
  }

  function save() {
    const t = titleRef.current?.innerText || title;
    const d = descRef.current?.innerText || description;
    saveItems(items.map(i => i.id === id ? {
      ...i,
      aiTitle: t,
      aiDescription: d,
      aiSuggestedPrice: suggestedPrice,
    } : i));
    showToast('Listing saved to item!');
    navigate(`/item/${id}`);
  }

  return (
    <>
      <PageHeader title="AI Listing" back />

      <div className="page-scroll">
        <div style={{ padding: '20px 16px 32px' }}>

          {/* Photos */}
          {(item.photoBefore || item.photoAfter) && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {item.photoBefore && (
                <img src={item.photoBefore} style={{ flex: 1, height: 90, objectFit: 'cover', borderRadius: 10 }} />
              )}
              {item.photoAfter && (
                <img src={item.photoAfter} style={{ flex: 1, height: 90, objectFit: 'cover', borderRadius: 10 }} />
              )}
            </div>
          )}

          {/* Generate button */}
          {!generated && !loading && (
            <div style={{ marginBottom: 24 }}>
              <Button size="full" onClick={generate} disabled={loading}>
                ✦ Generate Listing with AI
              </Button>
              <p style={{ fontSize: 12, color: 'var(--dust)', textAlign: 'center', marginTop: 10 }}>
                Uses Claude AI to write a complete Facebook Marketplace listing
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div className="spinner spinner-dark" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--dust)', fontSize: 14 }}>Claude is writing your listing…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: '#FEE2E2', border: '1.5px solid #FECACA',
              borderRadius: 12, padding: 14, marginBottom: 16,
              fontSize: 13, color: '#B91C1C',
            }}>
              {error}
            </div>
          )}

          {/* Results */}
          {generated && !loading && (
            <div className="fade-up">

              {/* Title */}
              <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div className="label-caps">Title</div>
                  <button onClick={() => copy(titleRef.current?.innerText || title)} style={{
                    background: 'none', border: 'none', fontSize: 12, color: 'var(--sienna)',
                    fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Copy
                  </button>
                </div>
                <div
                  ref={titleRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={e => setTitle(e.currentTarget.innerText)}
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--charcoal)',
                    outline: 'none',
                    lineHeight: 1.3,
                    minHeight: 24,
                    padding: '2px 0',
                  }}
                >
                  {title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--dust)', marginTop: 6 }}>✎ tap to edit</div>
              </div>

              {/* Price */}
              <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                <div className="label-caps" style={{ marginBottom: 8 }}>Suggested Price</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: 'var(--sage)' }}>
                      ${suggestedPrice}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--dust)', marginTop: 2 }}>
                      True cost: ${trueCost.toFixed(2)} · Profit: ${(suggestedPrice - trueCost).toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div className="label-caps">Description</div>
                  <button onClick={() => copy(descRef.current?.innerText || description)} style={{
                    background: 'none', border: 'none', fontSize: 12, color: 'var(--sienna)',
                    fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Copy
                  </button>
                </div>
                <div
                  ref={descRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={e => setDescription(e.currentTarget.innerText)}
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: 'var(--charcoal)',
                    whiteSpace: 'pre-wrap',
                    outline: 'none',
                    minHeight: 80,
                  }}
                >
                  {description}
                </div>
                <div style={{ fontSize: 11, color: 'var(--dust)', marginTop: 6 }}>✎ tap to edit</div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Button size="full" onClick={save}>
                  Save to Item
                </Button>
                <Button size="full" variant="secondary" onClick={generate}>
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
