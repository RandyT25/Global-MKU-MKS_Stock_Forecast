import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { parsePendingCSV } from '../utils/forecast';
import { DataInputPanel } from '../components/DataInputPanel';

type DivTab = 'MKU' | 'MKS';

function ratioBadge(ratio: number | null): string {
  if (ratio === null) return 'text-gray-400';
  if (ratio < 1.0)  return 'bg-red-100 text-red-700 font-bold';
  if (ratio < 1.5)  return 'bg-orange-100 text-orange-700 font-semibold';
  if (ratio < 2.0)  return 'bg-yellow-100 text-yellow-700';
  return 'bg-green-100 text-green-700';
}

function ratioBarColor(ratio: number | null): string {
  if (ratio === null) return 'bg-gray-200';
  if (ratio < 1.0)  return 'bg-red-400';
  if (ratio < 1.5)  return 'bg-orange-400';
  if (ratio < 2.0)  return 'bg-yellow-400';
  return 'bg-green-400';
}

export function PendingPOs() {
  const { pendingMku, pendingMks, setPendingMku, setPendingMks } = useAppStore();
  const [tab, setTab] = useState<DivTab>('MKU');
  const [search, setSearch] = useState('');
  const [filterCritical, setFilterCritical] = useState(false);
  const [sortBy, setSortBy] = useState<'ratio3M' | 'ratioCurrent' | 'pending' | 'stock'>('ratio3M');

  const rows = tab === 'MKU' ? pendingMku : pendingMks;

  const handleData = (tsv: string, _mode: 'replace' | 'append') => {
    const parsed = parsePendingCSV(tsv, tab);
    if (!parsed.length) return { ok: false, message: 'Could not parse. Expected columns: Kode_Brg | Nama_Brg | Kode_sat_Std | Saldo Akhir (Std) | [months] | Rata - Rata 3 Bulan | Penjualan Tgl … | Pending | PR | Ratio 3 Bulan | Ratio Bulan Berjalan | Keterangan' };
    if (tab === 'MKU') setPendingMku(parsed);
    else               setPendingMks(parsed);
    return { ok: true, message: `${parsed.length.toLocaleString()} products loaded for ${tab}.` };
  };

  const filtered = useMemo(() => {
    let r = rows;
    if (filterCritical) r = r.filter(x => x.ratio3M !== null && x.ratio3M < 1.0);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x => x.product.toLowerCase().includes(q) || x.code.toLowerCase().includes(q));
    }
    return [...r].sort((a, b) => {
      if (sortBy === 'ratio3M')      return (a.ratio3M      ?? 99) - (b.ratio3M      ?? 99);
      if (sortBy === 'ratioCurrent') return (a.ratioCurrent ?? 99) - (b.ratioCurrent ?? 99);
      if (sortBy === 'pending')      return b.pending - a.pending;
      return b.stockBalance - a.stockBalance;
    });
  }, [rows, filterCritical, search, sortBy]);

  const criticalCount = rows.filter(r => r.ratio3M !== null && r.ratio3M < 1.0).length;
  const warningCount  = rows.filter(r => r.ratio3M !== null && r.ratio3M >= 1.0 && r.ratio3M < 1.5).length;
  const totalPending  = rows.reduce((s, r) => s + r.pending, 0);

  const maxRatio = useMemo(() => {
    const vals = rows.map(r => r.ratio3M).filter((v): v is number => v !== null);
    return vals.length ? Math.min(Math.max(...vals), 5) : 5;
  }, [rows]);

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Pending POs</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Upload the Pending PO file per division — when prompted, pick the <strong>Ratio MKU</strong> or <strong>Ratio MKS</strong> sheet
          for fully populated PR values (the main PENDING sheet leaves PR blank).
          Ratio &lt; 1.0 means stock runs out before the pending delivery arrives.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {(['MKU', 'MKS'] as DivTab[]).map(d => (
          <button key={d} onClick={() => setTab(d)}
            className={`px-5 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === d ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {d} ({(d === 'MKU' ? pendingMku : pendingMks).length.toLocaleString()})
          </button>
        ))}
      </div>

      <DataInputPanel
        title={`${tab} Pending Data`}
        rowCount={rows.length}
        showModeToggle={false}
        onData={handleData}
        onClear={() => (tab === 'MKU' ? setPendingMku : setPendingMks)([])}
        pasteHint="Kode_Brg&#9;Nama_Brg&#9;Kode_sat_Std&#9;Saldo Akhir (Std)&#9;Mar&#9;Apr&#9;Mei&#9;Rata - Rata 3 Bulan&#9;Penjualan Tgl…&#9;Pending&#9;PR&#9;Ratio 3 Bulan&#9;Ratio Bulan Berjalan&#9;Keterangan"
      />

      {rows.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500">Total Products</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{rows.length}</div>
            </div>
            <div className={`rounded-xl border p-4 ${criticalCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
              <div className="text-xs text-gray-500">Critical (ratio &lt; 1.0)</div>
              <div className={`text-2xl font-bold mt-1 ${criticalCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{criticalCount}</div>
            </div>
            <div className={`rounded-xl border p-4 ${warningCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
              <div className="text-xs text-gray-500">Warning (1.0 – 1.5)</div>
              <div className={`text-2xl font-bold mt-1 ${warningCount > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{warningCount}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500">Total Pending Qty</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{totalPending.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Product or code…"
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input type="checkbox" checked={filterCritical} onChange={e => setFilterCritical(e.target.checked)} />
              Critical only ({criticalCount})
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Sort by:</span>
              {([['ratio3M', 'Ratio 3M'], ['ratioCurrent', 'Ratio Current'], ['pending', 'Pending Qty'], ['stock', 'Stock']] as const).map(([val, label]) => (
                <button key={val} onClick={() => setSortBy(val)}
                  className={`px-2.5 py-1 text-xs rounded-full border ${sortBy === val ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 hover:border-gray-400'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr className="text-gray-500 text-xs uppercase border-b border-gray-200">
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left">Unit</th>
                    <th className="px-3 py-2 text-right">Stock</th>
                    <th className="px-3 py-2 text-right">M-3</th>
                    <th className="px-3 py-2 text-right">M-2</th>
                    <th className="px-3 py-2 text-right">M-1</th>
                    <th className="px-3 py-2 text-right">Avg 3M</th>
                    <th className="px-3 py-2 text-right">Current</th>
                    <th className="px-3 py-2 text-right">Pending</th>
                    <th className="px-3 py-2 text-right">PR</th>
                    <th className="px-3 py-2 text-left">Last Receipt</th>
                    <th className="px-3 py-2 text-center" style={{ minWidth: 110 }}>Ratio 3M</th>
                    <th className="px-3 py-2 text-center" style={{ minWidth: 110 }}>Ratio Current</th>
                    <th className="px-3 py-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((row, i) => {
                    const r3 = row.ratio3M;
                    const barPct = r3 !== null ? Math.min((r3 / maxRatio) * 100, 100) : 0;
                    return (
                      <tr key={i} className={`hover:bg-gray-50 ${r3 !== null && r3 < 1.0 ? 'bg-red-50' : r3 !== null && r3 < 1.5 ? 'bg-orange-50' : ''}`}>
                        <td className="px-3 py-1.5 font-mono text-xs text-gray-400">{row.code}</td>
                        <td className="px-3 py-1.5 text-gray-800 max-w-[200px] truncate font-medium">{row.product}</td>
                        <td className="px-3 py-1.5 text-xs text-gray-500">{row.unit}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{row.stockBalance.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-500">{row.month1Sales.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-500">{row.month2Sales.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-500">{row.month3Sales.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-700">{row.avg3M.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-blue-600">{row.currentSales.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-semibold">{row.pending.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-gray-500">{row.pr > 0 ? row.pr.toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '—'}</td>
                        <td className="px-3 py-1.5 text-xs">
                          {row.tglLPB ? (
                            <span className="text-gray-600">{row.tglLPB}
                              {row.qtyLPB > 0 && <span className="text-gray-400 ml-1">({row.qtyLPB.toLocaleString('id-ID', { maximumFractionDigits: 0 })})</span>}
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-3 py-1.5">
                          {r3 !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className={`h-full rounded-full ${ratioBarColor(r3)}`} style={{ width: `${barPct}%` }} />
                              </div>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${ratioBadge(r3)}`}>{r3.toFixed(2)}×</span>
                            </div>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-3 py-1.5">
                          {row.ratioCurrent !== null ? (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${ratioBadge(row.ratioCurrent)}`}>{row.ratioCurrent.toFixed(2)}×</span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-3 py-1.5 text-xs text-gray-400 max-w-[120px] truncate">{row.notes}</td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={15} className="px-3 py-8 text-center text-gray-400">No matching products</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> Critical &lt; 1.0×</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-400 inline-block" /> Warning 1.0–1.5×</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> Monitor 1.5–2.0×</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-400 inline-block" /> OK &gt; 2.0×</span>
            <span className="text-gray-400">Ratio = (Stock + Pending) ÷ 3M Avg</span>
          </div>
        </>
      )}

      {rows.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📦</div>
          <p className="font-medium">No {tab} pending data loaded</p>
          <p className="text-sm mt-1">Upload the PENDING {tab} sheet above</p>
        </div>
      )}
    </div>
  );
}
