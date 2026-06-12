import type { StockStatus } from '../types';

const CONFIG: Record<StockStatus, { label: string; className: string }> = {
  'OUT OF STOCK': { label: '🔴 OUT OF STOCK', className: 'bg-red-100 text-red-800 border border-red-300' },
  'PO OVERDUE': { label: '🔴 PO OVERDUE', className: 'bg-red-50 text-red-700 border border-red-200' },
  'ORDER THIS WEEK': { label: '🟠 ORDER THIS WEEK', className: 'bg-orange-100 text-orange-800 border border-orange-300' },
  'ORDER SOON': { label: '🟢 ORDER SOON', className: 'bg-green-100 text-green-800 border border-green-300' },
  'MONITOR': { label: '🟡 MONITOR', className: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
  'OK': { label: '✅ OK', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
};

export function StatusBadge({ status }: { status: StockStatus }) {
  const cfg = CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function getStatusColor(status: StockStatus): string {
  const map: Record<StockStatus, string> = {
    'OUT OF STOCK': 'bg-red-50',
    'PO OVERDUE': 'bg-red-50',
    'ORDER THIS WEEK': 'bg-orange-50',
    'ORDER SOON': 'bg-green-50',
    'MONITOR': 'bg-yellow-50',
    'OK': '',
  };
  return map[status] || '';
}
