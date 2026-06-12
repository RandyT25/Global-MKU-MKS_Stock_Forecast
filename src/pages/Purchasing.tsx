import { useMemo, useState } from 'react';
import { parseISO } from 'date-fns';
import { useAppStore } from '../store/appStore';
import { computeForecast } from '../utils/forecast';
import { StatusBadge } from '../components/StatusBadge';
import type { StockStatus } from '../types';

const URGENT_STATUSES: StockStatus[] = ['OUT OF STOCK', 'PO OVERDUE', 'ORDER THIS WEEK', 'ORDER SOON', 'MONITOR'];
const STATUS_ORDER: StockStatus[] = ['OUT OF STOCK', 'PO OVERDUE', 'ORDER THIS WEEK', 'ORDER SOON', 'MONITOR'];

export function Purchasing() {
  const { mkuStock, mksStock, productSetups, deals, settings } = useAppStore();
  const [showOK, setShowOK] = useState(false);

  const forecast = useMemo(() =>
    computeForecast([...mkuStock, ...mksStock], productSetups, deals, settings.safetyBufferPct, parseISO(settings.today)),
    [mkuStock, mksStock, productSetups, deals, settings]
  );

  const urgentRows = useMemo(() =>
    forecast
      .filter(r => showOK ? true : URGENT_STATUSES.includes(r.status))
      .sort((a, b) => {
        const oa = STATUS_ORDER.indexOf(a.status as StockStatus);
        const ob = STATUS_ORDER.indexOf(b.status as StockStatus);
        if (oa !== ob) return oa - ob;
        return (a.daysLeft === 999 ? 9999 : a.daysLeft) - (b.daysLeft === 999 ? 9999 : b.daysLeft);
      }),
    [forecast, showOK]
  );

  const counts: Record<string, number> = useMemo(() => {
    const c: Record<string, number> = {};
    forecast.forEach(r => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [forecast]);

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Purchasing Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Imported products — PO deadline tracker. Sorted by urgency: most critical items first.</p>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Out of Stock / PO Overdue', count: (counts['OUT OF STOCK'] || 0) + (counts['PO OVERDUE'] || 0), color: 'bg-red-600 text-white' },
          { label: 'Order This Week', count: counts['ORDER THIS WEEK'] || 0, color: 'bg-orange-500 text-white' },
          { label: 'Order Soon', count: counts['ORDER SOON'] || 0, color: 'bg-green-500 text-white' },
          { label: 'Monitor', count: counts['MONITOR'] || 0, color: 'bg-yellow-400 text-gray-900' },
          { label: 'OK', count: counts['OK'] || 0, color: 'bg-emerald-100 text-emerald-800' },
        ].map(cfg => (
          <div key={cfg.label} className={`${cfg.color} rounded-lg p-4 text-center`}>
            <div className="text-3xl font-bold">{cfg.count}</div>
            <div className="text-xs font-medium mt-1 opacity-90">{cfg.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900">
          Items Requiring Action
          <span className="ml-2 text-sm font-normal text-gray-400">Auto-updates on every recalculate · OK items {showOK ? 'shown' : 'hidden'}</span>
        </h2>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showOK} onChange={e => setShowOK(e.target.checked)} className="rounded" />
          Show OK items
        </label>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-200">
                <th className="px-3 py-2.5 text-left">Div</th>
                <th className="px-3 py-2.5 text-left">Code</th>
                <th className="px-3 py-2.5 text-left">Product</th>
                <th className="px-3 py-2.5 text-left">Unit</th>
                <th className="px-3 py-2.5 text-right">Stock</th>
                <th className="px-3 py-2.5 text-right">Days Left</th>
                <th className="px-3 py-2.5 text-right">Daily Sales</th>
                <th className="px-3 py-2.5 text-left">Run-out Date</th>
                <th className="px-3 py-2.5 text-left">PO Must Be Sent By</th>
                <th className="px-3 py-2.5 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {urgentRows.map((row, i) => (
                <tr key={i} className={
                  row.status === 'OUT OF STOCK' ? 'bg-red-50' :
                  row.status === 'PO OVERDUE' ? 'bg-red-50/50' :
                  row.status === 'ORDER THIS WEEK' ? 'bg-orange-50' :
                  row.status === 'ORDER SOON' ? 'bg-green-50/50' :
                  row.status === 'MONITOR' ? 'bg-yellow-50/50' : ''
                }>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${row.div === 'MKS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {row.div}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-500 font-mono text-xs">{row.code}</td>
                  <td className="px-3 py-2 font-medium text-gray-900 max-w-xs">
                    <span className="truncate block" title={row.product}>{row.product}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-500">{row.unit}</td>
                  <td className="px-3 py-2 text-right font-mono">{row.stock.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right font-mono font-medium">
                    {row.daysLeft === 999 ? '—' : row.daysLeft === 0 ? <span className="text-red-600">0</span> : row.daysLeft.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-gray-600">{row.dailyRate.toFixed(2)}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.runoutDate || '—'}</td>
                  <td className={`px-3 py-2 whitespace-nowrap font-medium ${row.poDeadline === 'OVERDUE' ? 'text-red-600' : 'text-gray-700'}`}>
                    {row.poDeadline || '—'}
                  </td>
                  <td className="px-3 py-2"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
              {urgentRows.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-400">No items requiring action</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Guide */}
      <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
        {[
          { status: 'OUT OF STOCK / PO OVERDUE', desc: 'Zero stock or PO should have gone already — escalate now', color: 'border-red-300 bg-red-50' },
          { status: 'ORDER THIS WEEK', desc: 'PO deadline within 7 days — send PO without fail this week', color: 'border-orange-300 bg-orange-50' },
          { status: 'ORDER SOON', desc: 'PO deadline within 14 days — prepare and send PO this week', color: 'border-green-300 bg-green-50' },
          { status: 'MONITOR', desc: 'On track — check again next week', color: 'border-yellow-300 bg-yellow-50' },
          { status: 'OK', desc: '30+ days remaining — no action needed', color: 'border-emerald-300 bg-emerald-50' },
        ].map(g => (
          <div key={g.status} className={`p-2 rounded border ${g.color}`}>
            <div className="font-semibold">{g.status}</div>
            <div className="text-gray-600 mt-0.5">{g.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
