export type Div = 'MKS' | 'MKU';

export type StockStatus =
  | 'OUT OF STOCK'
  | 'PO OVERDUE'
  | 'ORDER THIS WEEK'
  | 'ORDER SOON'
  | 'MONITOR'
  | 'OK';

export type DealStage = 'Confirmed' | 'Sample Given' | 'Prospect' | 'Cancelled';

export interface StockRow {
  code: string;
  name: string;
  unit: string;
  stock: number;
  salesJan: number;
  salesFeb: number;
  salesMar: number;
  avg3M: number;
  currentMonthSales: number;
  div: Div;
}

export interface ProductSetup {
  div: Div;
  code: string;
  name: string;
  unit: string;
  type: string;
  safetyStock: number;
  supplier: string;
  country: string;
  leadTime: number;
  unitPrice: number;
}

export interface GlobalSettings {
  safetyStockDays: number;
  safetyBufferPct: number;
  today: string; // ISO date string
}

export interface SeasonalityIndex {
  month: number; // 1-12
  name: string;
  index: number;
  description: string;
}

export interface NewDeal {
  id: string;
  customer: string;
  product: string;
  div: Div;
  expectedVolMonth: number;
  dealStage: DealStage;
  confidencePct: number;
  startDate: string;
  notes: string;
}

export interface ForecastRow {
  div: Div;
  code: string;
  product: string;
  unit: string;
  stock: number;
  pendingPO: number;
  avg3M: number;
  marSales: number;
  dailyRate: number;
  newDealPerDay: number;
  daysLeft: number;
  runoutDate: string | null;
  poDeadline: string | null;
  leadTime: number;
  status: StockStatus;
  actionRank: number | null;
}

export interface LostOrder {
  id: string;
  div: Div;
  date: string;
  soNumber: string;
  customer: string;
  sales: string;
  product: string;
  qtyOrdered: number;
  unit: string;
  qtyDelivered: number;
  qtyLost: number;
  status: string;
  unitPrice: number;
  valueLost: number;
}

export interface SaleRow {
  customer: string;
  code: string;
  product: string;
  qty: number;
  total: number;
  sales: string;
  orderType: string;
  month: number;
  monthName: string;
  div: string;
  year: number;
}

export interface PendingPORow {
  div: Div;
  code: string;
  product: string;
  unit: string;
  stockBalance: number;
  month1Sales: number;
  month2Sales: number;
  month3Sales: number;
  avg3M: number;
  currentSales: number;
  tglLPB: string;      // date of last goods receipt
  qtyLPB: number;      // qty of last goods receipt
  pending: number;
  pr: number;          // Purchase Request qty (populated in Ratio MKU/MKS sheets)
  ratio3M: number | null;
  ratioCurrent: number | null;
  notes: string;
}

export interface DeliveryRow {
  div: Div;
  date: string;
  soNumber: string;
  wilayah: string;
  customer: string;
  sales: string;
  code: string;
  product: string;
  brand: string;
  qtySO: number;
  unit: string;
  qtyKirim: number;
  qtySisa: number;
  ket: string;
}
