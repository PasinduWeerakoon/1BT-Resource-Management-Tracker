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

export const buildAllocationsByResourceId = (allocations = []) => {
  const map = new Map();
  allocations.forEach((allocation) => {
    if (!allocation) return;
    if (allocation.resource_id !== undefined) {
      map.set(allocation.resource_id, allocation);
    } else if (allocation.id !== undefined) {
      map.set(allocation.id, allocation);
    }
  });
  return map;
};

export const buildAllocationsByEmployeeName = (allocations = []) => {
  const map = new Map();
  allocations.forEach((allocation) => {
    if (allocation?.employee_name) {
      map.set(allocation.employee_name, allocation);
    }
  });
  return map;
};
