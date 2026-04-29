// Takes a supply to archive and the current full supplies array.
// Returns a new supplies array with the supply either merged into an existing
// depleted record (stacked) or marked depleted as a new archive entry.
export function archiveSupply(supply, allSupplies) {
  const nameLower = supply.name.trim().toLowerCase();
  const brandLower = (supply.brand || '').trim().toLowerCase();

  const existingArchive = allSupplies.find(s =>
    s.id !== supply.id &&
    s.status === 'depleted' &&
    s.name.trim().toLowerCase() === nameLower &&
    (s.brand || '').trim().toLowerCase() === brandLower
  );

  if (existingArchive) {
    const dates = [supply.purchaseDate, existingArchive.purchaseDate].filter(Boolean).sort();
    const merged = {
      ...existingArchive,
      totalQty: existingArchive.totalQty + supply.totalQty,
      totalCost: existingArchive.totalCost + supply.totalCost,
      purchaseDate: dates[dates.length - 1],
    };
    return allSupplies
      .filter(s => s.id !== supply.id)
      .map(s => s.id === existingArchive.id ? merged : s);
  }

  return allSupplies.map(s =>
    s.id === supply.id ? { ...s, status: 'depleted' } : s
  );
}
