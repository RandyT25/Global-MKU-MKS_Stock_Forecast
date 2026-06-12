import { useMemo } from 'react';
import { parseISO } from 'date-fns';
import { useAppStore } from '../store/appStore';
import { computeForecast } from '../utils/forecast';

export function StockHealth() {
  const { mkuStock, mksStock, productSetups, deals, settings } = useAppStore();
  const forecast = useMemo(() =>
    computeForecast([...mkuStock, ...mksStock], productSetups, deals, settings.safetyBufferPct, parseISO(settings.today)),
    [mkuStock, mksStock, productSetups, deals, settings]
  );

  const stats = useMemo(() => {
    const notSelling3M = forecast.filter(r => r.avg3M === 0 && r.marSales === 0 && r.stock > 0);
    const stoppedLastMonth = forecast.filter(r => r.marSales === 0 && r.avg3M > 0);
    const slowMoving = forecast.filter(r => r.daysLeft > 90 && r.daysLeft !== 999);
    const deadStock = forecast.filter(r => r.avg3M === 0 && r.marSales === 0 && r.dailyRate === 0);
    const zeroStockStillSelling = forecast.filter(r => r.stock === 0 && r.dailyRate > 0);
    const archiveCandidates = forecast.filter(r => r.stock === 0 && r.avg3M === 0 && r.marSales === 0);
    return { notSelling3M, stoppedLastMonth, slowMoving, deadStock, zeroStockStillSelling, archiveCandidates };
  }, [forecast]);

  const CATEGORIES = [
    { key: 'notSelling3M', label: 'Not Selling (3 Months)', items: stats.notSelling3M, color: 'bg-orange-50 border-orange-200', count: stats.notSelling3M.length, desc: 'In stock but no sales in last 3 months' },
    { key: 'stoppedLastMonth', label: 'Stopped Last Month', items: stats.stoppedLastMonth, color: 'bg-yellow-50 border-yellow-200', count: stats.stoppedLastMonth.length, desc: 'Had 3M avg but no sales in latest month' },
    { key: 'slowMoving', label: 'Slow Moving (90+ Days)', items: stats.slowMoving, color: 'bg-blue-50 border-blue-200', count: stats.slowMoving.length, desc: 'More than 90 days of stock on hand' },
    { key: 'deadStock', label: 'Dead Stock (0 Sales All 4M)', items: stats.deadStock, color: 'bg-red-50 border-red-200', count: stats.deadStock.length, desc: 'No sales in any tracked month' },
    { key: 'zeroStockStillSelling', label: 'Zero Stock (Still Selling)', items: stats.zeroStockStillSelling, color: 'bg-rose-50 border-rose-200', count: stats.zeroStockStillSelling.length, desc: 'Out of stock but demand exists' },
    { key: 'archiveCandidates', label: 'Archive Candidates', items: stats.archiveCandidates, color: 'bg-gray-50 border-gray-200', count: stats.archiveCandidates.length, desc: 'Zero stock + zero sales — consider removing' },
  ];

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Stock Health Analysis</h1>
        <p className="text-sm text-gray-500 mt-0.5">MKS + MKU Combined · Identifies dead stock, slow movers & archive candidates</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-7 gap-3 mb-6">
        {CATEGORIES.map(c => (
          <div key={c.key} className={`rounded-xl border p-3 text-center ${c.color}`}>
            <div className="text-2xl font-bold text-gray-900">{c.count}</div>
            <div className="text-xs text-gray-600 mt-1 leading-tight">{c.label}</div>
          </div>
        ))}
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{forecast.length}</div>
          <div className="text-xs text-gray-600 mt-1 leading-tight">Total All Items</div>
        </div>
      </div>

      {/* Detailed tables */}
      <div className="space-y-5">
        {CATEGORIES.map(cat => (
          <div key={cat.key} className={`rounded-xl border ${cat.color} overflow-hidden`}>
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">{cat.label}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{cat.desc}</p>
              </div>
              <span className="text-2xl font-bold text-gray-700">{cat.count}</span>
            </div>
            {cat.items.length > 0 && (
              <div className="bg-white border-t border-gray-100 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <th className="px-3 py-2 text-left">Div</th>
                      <th className="px-3 py-2 text-left">Code</th>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-right">Stock</th>
                      <th className="px-3 py-2 text-right">Avg 3M</th>
                      <th className="px-3 py-2 text-right">Mar Sales</th>
                      <th className="px-3 py-2 text-right">Days Left</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cat.items.slice(0, 20).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-1.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${row.div === 'MKS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{row.div}</span>
                        </td>
                        <td className="px-3 py-1.5 font-mono text-xs text-gray-400">{row.code}</td>
                        <td className="px-3 py-1.5 text-gray-800">{row.product}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{row.stock.toFixed(1)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-500">{row.avg3M.toFixed(1)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-500">{row.marSales.toFixed(1)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-500">{row.daysLeft === 999 ? '—' : row.daysLeft.toFixed(0)}</td>
                      </tr>
                    ))}
                    {cat.items.length > 20 && (
                      <tr><td colSpan={7} className="px-3 py-2 text-center text-xs text-gray-400">... and {cat.items.length - 20} more</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
