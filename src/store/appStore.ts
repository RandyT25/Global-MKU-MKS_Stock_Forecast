import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { idbStorage } from '../utils/idbStorage';
import type { StockRow, ProductSetup, NewDeal, LostOrder, GlobalSettings, SaleRow, DeliveryRow, PendingPORow } from '../types';
import { SEED_MKS_STOCK, SEED_MKU_STOCK, SEED_PRODUCT_SETUP, SEED_NEW_DEALS, SEED_LOST_ORDERS } from '../data/seedData';

interface AppState {
  settings: GlobalSettings;
  mkuStock: StockRow[];
  mksStock: StockRow[];
  productSetups: ProductSetup[];
  deals: NewDeal[];
  lostOrders: LostOrder[];
  sales: SaleRow[];
  deliveryMku: DeliveryRow[];
  deliveryMks: DeliveryRow[];
  pendingMku: PendingPORow[];
  pendingMks: PendingPORow[];

  updateSettings: (s: Partial<GlobalSettings>) => void;
  setMkuStock: (rows: StockRow[]) => void;
  setMksStock: (rows: StockRow[]) => void;
  setProductSetup: (setups: ProductSetup[]) => void;
  upsertProductSetup: (setup: ProductSetup) => void;
  addDeal: (deal: NewDeal) => void;
  updateDeal: (id: string, deal: Partial<NewDeal>) => void;
  removeDeal: (id: string) => void;
  addLostOrder: (order: LostOrder) => void;
  updateLostOrder: (id: string, order: Partial<LostOrder>) => void;
  removeLostOrder: (id: string) => void;
  setLostOrders: (orders: LostOrder[]) => void;
  setSales: (rows: SaleRow[]) => void;
  appendSales: (rows: SaleRow[]) => void;
  setDeliveryMku: (rows: DeliveryRow[]) => void;
  setDeliveryMks: (rows: DeliveryRow[]) => void;
  appendDeliveryMku: (rows: DeliveryRow[]) => void;
  appendDeliveryMks: (rows: DeliveryRow[]) => void;
  setPendingMku: (rows: PendingPORow[]) => void;
  setPendingMks: (rows: PendingPORow[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settings: {
        safetyStockDays: 30,
        safetyBufferPct: 15,
        today: new Date().toISOString().split('T')[0],
      },
      mkuStock: SEED_MKU_STOCK,
      mksStock: SEED_MKS_STOCK,
      productSetups: SEED_PRODUCT_SETUP,
      deals: SEED_NEW_DEALS,
      lostOrders: SEED_LOST_ORDERS,
      sales: [],
      deliveryMku: [],
      deliveryMks: [],
      pendingMku: [],
      pendingMks: [],

      updateSettings: (s) => set(state => ({ settings: { ...state.settings, ...s } })),
      setMkuStock: (rows) => set({ mkuStock: rows }),
      setMksStock: (rows) => set({ mksStock: rows }),
      setProductSetup: (setups) => set({ productSetups: setups }),
      upsertProductSetup: (setup) => set(state => {
        const idx = state.productSetups.findIndex(p => p.code === setup.code && p.div === setup.div);
        if (idx >= 0) {
          const updated = [...state.productSetups];
          updated[idx] = setup;
          return { productSetups: updated };
        }
        return { productSetups: [...state.productSetups, setup] };
      }),
      addDeal: (deal) => set(state => ({ deals: [...state.deals, deal] })),
      updateDeal: (id, partial) => set(state => ({
        deals: state.deals.map(d => d.id === id ? { ...d, ...partial } : d),
      })),
      removeDeal: (id) => set(state => ({ deals: state.deals.filter(d => d.id !== id) })),
      addLostOrder: (order) => set(state => ({ lostOrders: [...state.lostOrders, order] })),
      updateLostOrder: (id, partial) => set(state => ({
        lostOrders: state.lostOrders.map(o => o.id === id ? { ...o, ...partial } : o),
      })),
      removeLostOrder: (id) => set(state => ({ lostOrders: state.lostOrders.filter(o => o.id !== id) })),
      setLostOrders: (orders) => set({ lostOrders: orders }),
      setSales: (rows) => set({ sales: rows }),
      appendSales: (rows) => set(state => ({ sales: [...state.sales, ...rows] })),
      setDeliveryMku: (rows) => set({ deliveryMku: rows }),
      setDeliveryMks: (rows) => set({ deliveryMks: rows }),
      appendDeliveryMku: (rows) => set(state => ({ deliveryMku: [...state.deliveryMku, ...rows] })),
      appendDeliveryMks: (rows) => set(state => ({ deliveryMks: [...state.deliveryMks, ...rows] })),
      setPendingMku: (rows) => set({ pendingMku: rows }),
      setPendingMks: (rows) => set({ pendingMks: rows }),
    }),
    {
      name: 'mku-mks-store',
      storage: idbStorage,
    }
  )
);
