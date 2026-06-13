import { useMemo } from 'react';
import { parseISO } from 'date-fns';
import { useAppStore } from '../store/appStore';
import { computeForecast } from '../utils/forecast';
import { StatusBadge } from '../components/StatusBadge';
import type { StockStatus } from '../types';

const STATUS_ORDER: StockStatus[] = ['OUT OF STOCK', 'PO OVERDUE', 'ORDER THIS WEEK', 'ORDER SOON', 'MONITOR', 'OK'];

const SUMMARY_CONFIG = [
  { status: 'OUT OF STOCK' as StockStatus, color: 'bg-red-600', textColor: 'text-white', label: 'Out of Stock' },
  { status: 'PO OVERDUE' as StockStatus, color: 'bg-red-400', textColor: 'text-white', label: 'PO Overdue' },
  { status: 'ORDER THIS WEEK' as StockStatus, color: 'bg-orange-500', textColor: 'text-white', label: 'Order This Week' },
  { status: 'ORDER SOON' as StockStatus, color: 'bg-green-500', textColor: 'text-white', label: 'Order Soon' },
  { status: 'MONITOR' as StockStatus, color: 'bg-yellow-400', textColor: 'text-gray-900', label: 'Monitor' },
  { status: 'OK' as StockStatus, color: 'bg-emerald-500', textColor: 'text-white', label: 'OK' },
];

export function Dashboard({ onNavigate }: { onNavigate: (page: string, filter?: string) => void }) {
  const { mkuStock, mksStock, productSetups, deals, settings, lostOrders } = useAppStore();

  const forecast = useMemo(() =>
    computeForecast([...mkuStock, ...mksStock], productSetups, deals, settings.safetyBufferPct, parseISO(settings.today)),
    [mkuStock, mksStock, productSetups, deals, settings]
  );

  const counts = useMemo(() => {
    const c: Record<StockStatus, number> = {
      'OUT OF STOCK': 0, 'PO OVERDUE': 0, 'ORDER THIS WEEK': 0, 'ORDER SOON': 0, 'MONITOR': 0, 'OK': 0,
    };
    forecast.forEach(r => { c[r.status]++; });
    return c;
  }, [forecast]);

  const urgentItems = forecast
    .filter(r => r.status !== 'OK' && r.status !== 'MONITOR')
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
    .slice(0, 15);

  const totalLostValue = lostOrders.reduce((s, o) => s + o.valueLost, 0);
  const ytdLoss = 95879645.884976;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Forecast Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Last updated: {settings.today} · Safety Buffer: {settings.safetyBufferPct}% · Safety Stock Days: {settings.safetyStockDays}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total Products</div>
          <div className="text-2xl font-bold text-gray-900">{forecast.length}</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {SUMMARY_CONFIG.map(cfg => (
          <button
            key={cfg.status}
            onClick={() => onNavigate('forecast', cfg.status)}
            className={`${cfg.color} ${cfg.textColor} rounded-lg p-4 text-center shadow-sm hover:opacity-90 transition-opacity`}
          >
            <div className="text-3xl font-bold">{counts[cfg.status]}</div>
            <div className="text-xs font-medium mt-1 opacity-90">{cfg.label}</div>
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Urgent Items - takes 2 cols */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Urgent Action Required</h2>
            <button onClick={() => onNavigate('purchasing')} className="text-sm text-blue-600 hover:underline">View all →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <th className="px-3 py-2 text-left">Div</th>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-right">Stock</th>
                  <th className="px-3 py-2 text-right">Days Left</th>
                  <th className="px-3 py-2 text-left">PO Deadline</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {urgentItems.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${row.div === 'MKS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {row.div}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900 max-w-xs truncate">{row.product}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{row.stock.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{row.daysLeft === 999 ? '—' : row.daysLeft.toFixed(1)}</td>
                    <td className="px-3 py-2 text-gray-600">{row.poDeadline || '—'}</td>
                    <td className="px-3 py-2"><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
                {urgentItems.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">No urgent items</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Lost Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Lost Orders</h2>
              <button onClick={() => onNavigate('lost-orders')} className="text-sm text-blue-600 hover:underline">View →</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total unfulfilled</span>
                <span className="font-bold text-red-600">{lostOrders.length} lines</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Value lost</span>
                <span className="font-bold text-red-600">
                  Rp {(totalLostValue / 1_000_000).toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">YTD loss</span>
                <span className="font-bold text-orange-600">
                  Rp {(ytdLoss / 1_000_000).toFixed(1)}M
                </span>
              </div>
            </div>
          </div>

          {/* New Deals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">New Deals Pipeline</h2>
              <button onClick={() => onNavigate('new-deals')} className="text-sm text-blue-600 hover:underline">View →</button>
            </div>
            <div className="p-4 space-y-3">
              {['Confirmed', 'Sample Given', 'Prospect'].map(stage => {
                const stageDeals = deals.filter(d => d.dealStage === stage);
                const totalVol = stageDeals.reduce((s, d) => s + d.expectedVolMonth * (d.confidencePct / 100), 0);
                return (
                  <div key={stage} className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{stage}</span>
                      <span className="ml-2 text-xs text-gray-400">{stageDeals.length} deals</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{totalVol.toFixed(0)} units/mo</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Settings</h2>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Safety Buffer</span>
                <span className="font-medium">{settings.safetyBufferPct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Safety Stock Days</span>
                <span className="font-medium">{settings.safetyStockDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Default Lead Time</span>
                <span className="font-medium">45 days</span>
              </div>
              <button
                onClick={() => onNavigate('product-setup')}
                className="w-full text-center text-blue-600 hover:underline text-xs mt-1"
              >
                Edit in Product Setup →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
