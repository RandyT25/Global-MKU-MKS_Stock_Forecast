import { useMemo, useState, useEffect } from 'react';
import { parseISO } from 'date-fns';
import { Search, Filter } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { computeForecast } from '../utils/forecast';
import { StatusBadge, getStatusColor } from '../components/StatusBadge';
import type { StockStatus, Div } from '../types';

export function ForecastEngine({ initialStatus = 'ALL' }: { initialStatus?: string }) {
  const { mkuStock, mksStock, productSetups, deals, settings } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterDiv, setFilterDiv] = useState<Div | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<StockStatus | 'ALL'>(initialStatus as StockStatus | 'ALL');

  useEffect(() => {
    setFilterStatus(initialStatus as StockStatus | 'ALL');
  }, [initialStatus]);
  const [sortKey, setSortKey] = useState<'actionRank' | 'daysLeft' | 'product'>('actionRank');

  const forecast = useMemo(() =>
    computeForecast([...mkuStock, ...mksStock], productSetups, deals, settings.safetyBufferPct, parseISO(settings.today)),
    [mkuStock, mksStock, productSetups, deals, settings]
  );

  const filtered = useMemo(() => {
    let rows = forecast;
    if (filterDiv !== 'ALL') rows = rows.filter(r => r.div === filterDiv);
    if (filterStatus !== 'ALL') rows = rows.filter(r => r.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => r.product.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
    }
    return [...rows].sort((a, b) => {
      if (sortKey === 'actionRank') {
        const ra = a.actionRank ?? 9999;
        const rb = b.actionRank ?? 9999;
        return ra - rb;
      }
      if (sortKey === 'daysLeft') return (a.daysLeft === 999 ? 9999 : a.daysLeft) - (b.daysLeft === 999 ? 9999 : b.daysLeft);
      return a.product.localeCompare(b.product);
    });
  }, [forecast, filterDiv, filterStatus, search, sortKey]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    forecast.forEach(r => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [forecast]);

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Forecast Engine</h1>
        <p className="text-sm text-gray-500 mt-0.5">Auto-calculated from stock input. Daily Rate = (Mar Sales ÷ 31 or 3M Avg ÷ 30) × (1 + {settings.safetyBufferPct}% buffer) + new deal volume</p>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['OUT OF STOCK', 'PO OVERDUE', 'ORDER THIS WEEK', 'ORDER SOON', 'MONITOR', 'OK'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s as StockStatus ? 'ALL' : s as StockStatus)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filterStatus === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {s}: {counts[s] || 0}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search product or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterDiv}
          onChange={e => setFilterDiv(e.target.value as Div | 'ALL')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Divisions</option>
          <option value="MKS">MKS</option>
          <option value="MKU">MKU</option>
        </select>
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as 'actionRank' | 'daysLeft' | 'product')}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="actionRank">Sort: Priority</option>
          <option value="daysLeft">Sort: Days Left</option>
          <option value="product">Sort: Product A-Z</option>
        </select>
        <div className="flex items-center text-sm text-gray-500 gap-1">
          <Filter size={14} />
          {filtered.length} of {forecast.length}
        </div>
      </div>

      {/* Table */}
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
                <th className="px-3 py-2.5 text-right">Avg 3M</th>
                <th className="px-3 py-2.5 text-right">Daily Rate</th>
                <th className="px-3 py-2.5 text-right">Deal/day</th>
                <th className="px-3 py-2.5 text-right">Days Left</th>
                <th className="px-3 py-2.5 text-left">Run-out</th>
                <th className="px-3 py-2.5 text-left">PO Deadline</th>
                <th className="px-3 py-2.5 text-right">Lead</th>
                <th className="px-3 py-2.5 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row, i) => (
                <tr key={i} className={`hover:bg-blue-50/30 transition-colors ${getStatusColor(row.status)}`}>
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
                  <td className="px-3 py-2 text-right font-mono text-gray-700">{row.stock.toLocaleString('en', { maximumFractionDigits: 1 })}</td>
                  <td className="px-3 py-2 text-right font-mono text-gray-500">{row.avg3M.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right font-mono text-gray-700">{row.dailyRate.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-mono text-blue-600">{row.newDealPerDay > 0 ? row.newDealPerDay.toFixed(2) : '—'}</td>
                  <td className="px-3 py-2 text-right font-mono font-medium text-gray-900">
                    {row.daysLeft === 999 ? '—' : row.daysLeft === 0 ? <span className="text-red-600">0</span> : row.daysLeft.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.runoutDate || '—'}</td>
                  <td className={`px-3 py-2 whitespace-nowrap font-medium ${row.poDeadline === 'OVERDUE' ? 'text-red-600' : 'text-gray-700'}`}>
                    {row.poDeadline || '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500">{row.leadTime}d</td>
                  <td className="px-3 py-2"><StatusBadge status={row.status} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={13} className="px-3 py-8 text-center text-gray-400">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formula legend */}
      <div className="mt-4 text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
        <strong>Formula:</strong> Daily Rate = (Mar Sales ÷ 31, or 3M Avg ÷ 30 if no Mar data) × (1 + Safety Buffer%) + New Deal volume × Confidence% ÷ 30 &nbsp;|&nbsp;
        Days Left = Stock ÷ Daily Rate &nbsp;|&nbsp; PO Deadline = Run-out Date − Lead Time
      </div>
    </div>
  );
}
