import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { parseSalesCSV, formatRp } from '../utils/forecast';
import { DataInputPanel } from '../components/DataInputPanel';

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function SalesGlobal() {
  const { sales, setSales, appendSales } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState(0);
  const [filterYear, setFilterYear] = useState(0);
  const [filterDiv, setFilterDiv] = useState('');
  const [filterType, setFilterType] = useState('');

  const years = useMemo(() => [...new Set(sales.map(s => s.year))].sort((a, b) => b - a), [sales]);
  const divs  = useMemo(() => [...new Set(sales.map(s => s.div))].filter(Boolean), [sales]);
  const types = useMemo(() => [...new Set(sales.map(s => s.orderType))].filter(Boolean), [sales]);

  const filtered = useMemo(() => {
    let rows = sales;
    if (filterMonth) rows = rows.filter(r => r.month === filterMonth);
    if (filterYear)  rows = rows.filter(r => r.year  === filterYear);
    if (filterDiv)   rows = rows.filter(r => r.div   === filterDiv);
    if (filterType)  rows = rows.filter(r => r.orderType === filterType);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.customer.toLowerCase().includes(q) ||
        r.product.toLowerCase().includes(q)  ||
        r.code.toLowerCase().includes(q)     ||
        r.sales.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [sales, filterMonth, filterYear, filterDiv, filterType, search]);

  const totalQty   = filtered.reduce((s, r) => s + r.qty, 0);
  const totalValue = filtered.reduce((s, r) => s + r.total, 0);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; value: number }> = {};
    filtered.forEach(r => {
      if (!map[r.code]) map[r.code] = { name: r.product, qty: 0, value: 0 };
      map[r.code].qty   += r.qty;
      map[r.code].value += r.total;
    });
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filtered]);

  const byMonth = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => {
      const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + r.total;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const maxMonthValue = byMonth.length ? Math.max(...byMonth.map(([, v]) => v)) : 1;

  const handleData = (tsv: string, mode: 'replace' | 'append') => {
    const rows = parseSalesCSV(tsv);
    if (!rows.length) return { ok: false, message: 'Could not parse. Expected columns: Nama_Wil | Kode_Cust | Nama Cust | Grup Cust | Kode_Brg | Nama Brg | Kategori Barang | Qty | DPP | PPN | Grand Total | Sales | Tipe_Order | bulan | nama bulan | Nama_Div | tahun' };
    if (mode === 'replace') setSales(rows);
    else appendSales(rows);
    return { ok: true, message: `${rows.length.toLocaleString()} rows ${mode === 'replace' ? 'loaded' : 'appended'}.` };
  };

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Sales Global</h1>
        <p className="text-sm text-gray-500 mt-0.5">Upload or paste from the SALES GLOBAL sheet. Use Append to add new months on top of existing data.</p>
      </div>

      <DataInputPanel
        title="Sales Data"
        rowCount={sales.length}
        showModeToggle
        onData={handleData}
        onClear={() => setSales([])}
        pasteHint="Nama_Wil&#9;Kode_Cust&#9;Nama Cust&#9;Grup Cust&#9;Kode_Brg&#9;Nama Brg&#9;Kategori Barang&#9;Qty&#9;DPP&#9;PPN&#9;Grand Total&#9;Sales&#9;Tipe_Order&#9;bulan&#9;nama bulan&#9;Nama_Div&#9;tahun"
      />

      {sales.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-5">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Filtered lines</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{filtered.length.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Total Qty</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{totalQty.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2">
              <div className="text-sm text-gray-500">Total DPP (filtered)</div>
              <div className="text-2xl font-bold text-blue-700 mt-1">{formatRp(totalValue)}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Customer, product, code…"
                className="pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
            </div>
            <select value={filterYear} onChange={e => setFilterYear(+e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value={0}>All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filterMonth} onChange={e => setFilterMonth(+e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value={0}>All Months</option>
              {MONTH_NAMES.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select value={filterDiv} onChange={e => setFilterDiv(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Divisions</option>
              {divs.map(d => <option key={d}>{d}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Types</option>
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-5 mb-5">
            <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Revenue by Month</h3>
              {byMonth.length === 0 ? <p className="text-sm text-gray-400">No data</p> : (
                <div className="space-y-1.5">
                  {byMonth.map(([key, val]) => {
                    const [yr, mo] = key.split('-');
                    const pct = (val / maxMonthValue) * 100;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className="w-16 text-xs text-gray-500 text-right">{MONTH_NAMES[parseInt(mo)]} {yr}</div>
                        <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="w-28 text-xs font-medium text-right text-gray-700">{formatRp(val)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Top Products (by DPP)</h3>
              <div className="space-y-2">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.qty.toLocaleString('id-ID', { maximumFractionDigits: 0 })} units</div>
                    </div>
                    <div className="text-xs font-bold text-blue-700 whitespace-nowrap">{formatRp(p.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-900 text-sm">Transactions</span>
              <span className="text-xs text-gray-400">{filtered.length.toLocaleString()} rows shown</span>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="text-gray-500 text-xs uppercase border-b border-gray-200">
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">DPP (Rp)</th>
                    <th className="px-3 py-2 text-left">Sales</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Month</th>
                    <th className="px-3 py-2 text-left">Div</th>
                    <th className="px-3 py-2 text-right">Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.slice(0, 500).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 font-medium text-gray-800 max-w-xs truncate">{row.customer}</td>
                      <td className="px-3 py-1.5 font-mono text-xs text-gray-400">{row.code}</td>
                      <td className="px-3 py-1.5 text-gray-700 max-w-xs truncate">{row.product}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{row.qty.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-gray-700">{formatRp(row.total)}</td>
                      <td className="px-3 py-1.5 text-gray-500 text-xs">{row.sales}</td>
                      <td className="px-3 py-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${row.orderType === 'Invoice' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {row.orderType}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-gray-500 text-xs">{row.monthName}</td>
                      <td className="px-3 py-1.5 text-gray-500 text-xs">{row.div}</td>
                      <td className="px-3 py-1.5 text-right text-gray-500 text-xs">{row.year}</td>
                    </tr>
                  ))}
                  {filtered.length > 500 && (
                    <tr><td colSpan={10} className="px-3 py-2 text-center text-xs text-gray-400">Showing first 500 of {filtered.length.toLocaleString()} rows</td></tr>
                  )}
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-400">No matching rows</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {sales.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-medium">No sales data loaded</p>
          <p className="text-sm mt-1">Upload the SALES GLOBAL Excel sheet above</p>
        </div>
      )}
    </div>
  );
}
