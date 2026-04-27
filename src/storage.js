export const KEYS = {
  items: 'ft_items_v1',
  supplies: 'ft_supplies_v1',
  allocs: 'ft_allocs_v1',
  savedStores: 'ft_stores_v1',
};

export const storage = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error('Storage full?', e); }
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
