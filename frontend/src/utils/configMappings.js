/**
 * Config mapping helpers
 * Reusable utilities to map config IDs to display labels.
 */

export const buildIdLabelMap = (items = []) => {
  const map = new Map();
  items.forEach((item) => {
    if (!item) return;
    const label = item.name || item.label;
    if (item.id !== undefined) map.set(item.id, label);
    if (item.value !== undefined) map.set(item.value, label);
  });
  return map;
};

export const getLabelFromMap = (map, id) => {
  if (!map || id === null || id === undefined) return null;
  return map.get(id) || null;
};
