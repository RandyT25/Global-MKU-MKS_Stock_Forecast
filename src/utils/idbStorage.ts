import { get, set, del } from 'idb-keyval';
import { createJSONStorage } from 'zustand/middleware';

// IndexedDB-backed storage adapter for Zustand persist.
// Replaces localStorage to avoid the ~5MB quota limit.
export const idbStorage = createJSONStorage<string>(() => ({
  getItem:    (name) => get<string>(name).then(v => v ?? null),
  setItem:    (name, value) => set(name, value),
  removeItem: (name) => del(name),
}));
