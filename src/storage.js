import { supabase } from './supabaseClient';

export const KEYS = {
  items: 'ft_items_v1',
  supplies: 'ft_supplies_v1',
  allocs: 'ft_allocs_v1',
  savedStores: 'ft_stores_v1',
};

// Which storage keys map to which Supabase table. Keys not listed here
// (savedStores) fall back to localStorage.
const TABLES = {
  [KEYS.items]: 'items',
  [KEYS.supplies]: 'supplies',
  [KEYS.allocs]: 'allocations',
};

// snake_case row -> camelCase app object
const FROM_ROW = {
  items: (r) => ({
    id: r.id,
    category: r.category,
    condition: r.condition,
    cost: r.cost,
    storeChain: r.store_chain,
    storeArea: r.store_area,
    notes: r.notes,
    photoBefore: r.photo_before,
    photoAfter: r.photo_after,
    qualityTier: r.quality_tier,
    listingPrice: r.listing_price,
    soldPrice: r.sold_price,
    acquiredDate: r.acquired_date,
    listedDate: r.listed_date,
    soldDate: r.sold_date,
    status: r.status,
    aiTitle: r.ai_title,
    aiDescription: r.ai_description,
    aiSuggestedPrice: r.ai_suggested_price,
  }),
  supplies: (r) => ({
    id: r.id,
    name: r.name,
    brand: r.brand,
    category: r.category,
    totalQty: r.total_qty,
    unit: r.unit,
    totalCost: r.total_cost,
    purchaseDate: r.purchase_date,
    store: r.store,
    notes: r.notes,
    status: r.status,
  }),
  allocations: (r) => ({
    id: r.id,
    itemId: r.item_id,
    supplyId: r.supply_id,
    pctUsed: r.pct_used,
    qtyUsed: r.qty_used,
    costAllocated: r.cost_allocated,
    date: r.date,
  }),
};

// camelCase app object -> snake_case row (inject user_id, undefined -> null)
const TO_ROW = {
  items: (v, uid) => ({
    id: v.id,
    user_id: uid,
    category: v.category ?? null,
    condition: v.condition ?? null,
    cost: v.cost ?? null,
    store_chain: v.storeChain ?? null,
    store_area: v.storeArea ?? null,
    notes: v.notes ?? null,
    photo_before: v.photoBefore ?? null,
    photo_after: v.photoAfter ?? null,
    quality_tier: v.qualityTier ?? null,
    listing_price: v.listingPrice ?? null,
    sold_price: v.soldPrice ?? null,
    acquired_date: v.acquiredDate ?? null,
    listed_date: v.listedDate ?? null,
    sold_date: v.soldDate ?? null,
    status: v.status ?? null,
    ai_title: v.aiTitle ?? null,
    ai_description: v.aiDescription ?? null,
    ai_suggested_price: v.aiSuggestedPrice ?? null,
  }),
  supplies: (v, uid) => ({
    id: v.id,
    user_id: uid,
    name: v.name ?? null,
    brand: v.brand ?? null,
    category: v.category ?? null,
    total_qty: v.totalQty ?? null,
    unit: v.unit ?? null,
    total_cost: v.totalCost ?? null,
    purchase_date: v.purchaseDate ?? null,
    store: v.store ?? null,
    notes: v.notes ?? null,
    status: v.status ?? null,
  }),
  allocations: (v, uid) => ({
    id: v.id,
    user_id: uid,
    item_id: v.itemId,
    supply_id: v.supplyId,
    pct_used: v.pctUsed ?? null,
    qty_used: v.qtyUsed ?? null,
    cost_allocated: v.costAllocated ?? null,
    date: v.date ?? null,
  }),
};

async function currentUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export const storage = {
  // Returns an array of camelCase objects for the given key.
  async get(key) {
    const table = TABLES[key];
    if (!table) {
      try { return JSON.parse(localStorage.getItem(key)) || []; }
      catch { return []; }
    }
    const uid = await currentUserId();
    const { data, error } = await supabase.from(table).select('*').eq('user_id', uid);
    if (error) throw error;
    return data.map(FROM_ROW[table]);
  },

  // Makes the user's table equal to `value` (the app always hands over the
  // full array): upsert everything, then delete rows no longer present.
  async set(key, value) {
    const table = TABLES[key];
    if (!table) {
      try { localStorage.setItem(key, JSON.stringify(value)); }
      catch (e) { console.error('Storage full?', e); }
      return;
    }
    const uid = await currentUserId();
    const rows = value.map(v => TO_ROW[table](v, uid));

    if (rows.length) {
      const { error: upErr } = await supabase.from(table).upsert(rows);
      if (upErr) throw upErr;
    }

    // Delete this user's rows that aren't in the new set.
    let del = supabase.from(table).delete().eq('user_id', uid);
    if (rows.length) {
      const idList = rows.map(r => `"${r.id}"`).join(',');
      del = del.not('id', 'in', `(${idList})`);
    }
    const { error: delErr } = await del;
    if (delErr) throw delErr;
  },
};

export async function compressImage(dataUrl, maxWidth = 800) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.src = dataUrl;
  });
}

export const itemSupplyCost = (itemId, allocs) =>
  allocs
    .filter(a => a.itemId === itemId)
    .reduce((sum, a) => sum + a.costAllocated, 0);

export const itemTrueCost = (item, allocs) =>
  item.cost + itemSupplyCost(item.id, allocs);

export const itemTrueProfit = (item, allocs) =>
  item.soldPrice - itemTrueCost(item, allocs);

export const supplyRemaining = (supply, allocs) => {
  const used = allocs
    .filter(a => a.supplyId === supply.id)
    .reduce((sum, a) => sum + a.qtyUsed, 0);
  return Math.max(0, supply.totalQty - used);
};

export const supplyValueRemaining = (supply, allocs) => {
  const rem = supplyRemaining(supply, allocs);
  const costPerUnit = supply.totalCost / supply.totalQty;
  return rem * costPerUnit;
};
