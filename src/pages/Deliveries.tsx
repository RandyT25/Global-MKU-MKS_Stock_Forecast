import { useState, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { parseDeliveryCSV } from '../utils/forecast';
import { DataInputPanel } from '../components/DataInputPanel';
import type { LostOrder } from '../types';

type DivTab = 'MKU' | 'MKS';
type StatusFilter = 'ALL' | 'FULFILLED' | 'UNFULFILLED' | 'PARTIAL';

function deliveryStatus(qtySO: number, qtyKirim: number, ket?: string): 'FULFILLED' | 'UNFULFILLED' | 'PARTIAL' {
  if (ket) {
    const k = ket.toUpperCase();
    if (k === 'FULFILLED')   return 'FULFILLED';
    if (k === 'UNFULFILLED') return 'UNFULFILLED';
    if (k === 'PARTIAL')     return 'PARTIAL';
  }
  if (qtyKirim <= 0 && qtySO > 0) return 'UNFULFILLED';
  if (qtyKirim >= qtySO)          return 'FULFILLED';
  return 'PARTIAL';
}

const STATUS_COLOR: Record<string, string> = {
  FULFILLED:   'bg-green-100 text-green-700',
  UNFULFILLED: 'bg-red-100 text-red-700',
  PARTIAL:     'bg-orange-100 text-orange-700',
};

const ROW_BG: Record<string, string> = {
  FULFILLED:   '',
  UNFULFILLED: 'bg-red-50',
  PARTIAL:     'bg-orange-50',
};

export function Deliveries() {
  const { deliveryMku, deliveryMks, setDeliveryMku, setDeliveryMks, appendDeliveryMku, appendDeliveryMks, addLostOrder } = useAppStore();
  const [tab, setTab] = useState<DivTab>('MKU');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [pushedKeys] = useState<Set<string>>(new Set());

  const rows = tab === 'MKU' ? deliveryMku : deliveryMks;

  const withStatus = useMemo(() =>
    rows.map(r => ({ ...r, _status: deliveryStatus(r.qtySO, r.qtyKirim, r.ket) })),
    [rows]);

  const filtered = useMemo(() => {
    let r = withStatus;
    if (statusFilter !== 'ALL') r = r.filter(row => row._status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(row =>
        row.customer.toLowerCase().includes(q) ||
        row.product.toLowerCase().includes(q)  ||
        row.soNumber.toLowerCase().includes(q)
      );
    }
    return r;
  }, [withStatus, statusFilter, search]);

  const unfulfilled = useMemo(() => withStatus.filter(r => r._status !== 'FULFILLED'), [withStatus]);

  const countOf = (s: StatusFilter) =>
    s === 'ALL' ? rows.length : withStatus.filter(r => r._status === s).length;

  const handleData = (tsv: string, mode: 'replace' | 'append') => {
    const parsed = parseDeliveryCSV(tsv, tab);
    if (!parsed.length) return { ok: false, message: 'Could not parse. Expected columns: No. Urut | Tgl. Kirim | No. SO | Nama Customer | Nama Sales | Kode Brg | Nama Barang | Nama Merk | SO(Kg) | Sat Std | BS(Pcs) | KETERANGAN' };
    if (tab === 'MKU') { if (mode === 'replace') setDeliveryMku(parsed); else appendDeliveryMku(parsed); }
    else               { if (mode === 'replace') setDeliveryMks(parsed); else appendDeliveryMks(parsed); }
    return { ok: true, message: `${parsed.length.toLocaleString()} lines loaded for ${tab}.` };
  };

  const pushToLostOrders = () => {
    const newOrders: LostOrder[] = unfulfilled
      .filter(r => !pushedKeys.has(`${r.soNumber}-${r.code}-${r.div}`))
      .map(r => ({
        id:           `${r.soNumber}-${r.code}-${r.div}-${Date.now()}-${Math.random()}`,
        div:          r.div,
        date:         r.date,
        soNumber:     r.soNumber,
        customer:     r.customer,
        sales:        r.sales,
        product:      r.product,
        qtyOrdered:   r.qtySO,
        unit:         r.unit,
        qtyDelivered: r.qtyKirim,
        qtyLost:      r.qtySisa,
        status:       'OPEN',
        unitPrice:    0,
        valueLost:    0,
      }));

    newOrders.forEach(o => {
      addLostOrder(o);
      pushedKeys.add(`${o.soNumber}-${o.div}`);
    });
  };

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Deliveries</h1>
        <p className="text-sm text-gray-500 mt-0.5">Upload from DELIVERY MKU / DELIVERY MKS sheets. Unfulfilled rows can be pushed to Lost Orders.</p>
      </div>

      {/* Division tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {(['MKU', 'MKS'] as DivTab[]).map(d => (
          <button key={d} onClick={() => setTab(d)}
            className={`px-5 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === d ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
            {d} ({(d === 'MKU' ? deliveryMku : deliveryMks).length.toLocaleString()})
          </button>
        ))}
      </div>

      <DataInputPanel
        title={`${tab} Delivery Data`}
        rowCount={rows.length}
        showModeToggle
        onData={handleData}
        onClear={() => (tab === 'MKU' ? setDeliveryMku : setDeliveryMks)([])}
        pasteHint="No. Urut&#9;Tgl. Kirim&#9;No. SO&#9;Wilayah&#9;Nama Cust&#9;Nama Sales&#9;Kode Brg&#9;Nama Brg&#9;Merk Brg&#9;Qty SO&#9;Satuan&#9;Qty BS&#9;KET"
      />

      {rows.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            {(['ALL', 'FULFILLED', 'PARTIAL', 'UNFULFILLED'] as StatusFilter[]).map(s => (
              <div key={s} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="text-xs text-gray-500">{s === 'ALL' ? 'Total Lines' : s}</div>
                <div className={`text-2xl font-bold mt-1 ${s === 'FULFILLED' ? 'text-green-600' : s === 'PARTIAL' ? 'text-orange-500' : s === 'UNFULFILLED' ? 'text-red-600' : 'text-gray-900'}`}>
                  {countOf(s).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Filters + push button */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Customer, product, SO…"
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
            {(['ALL', 'FULFILLED', 'PARTIAL', 'UNFULFILLED'] as StatusFilter[]).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${statusFilter === s ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                {s} ({countOf(s)})
              </button>
            ))}
            <div className="flex-1" />
            {unfulfilled.length > 0 && (
              <button onClick={pushToLostOrders}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                <ArrowRight size={14} />
                Push {unfulfilled.length} unfulfilled → Lost Orders
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr className="text-gray-500 text-xs uppercase border-b border-gray-200">
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">SO Number</th>
                    <th className="px-3 py-2 text-left">Wilayah</th>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left">Sales</th>
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left">Brand</th>
                    <th className="px-3 py-2 text-right">SO Qty</th>
                    <th className="px-3 py-2 text-left">Unit</th>
                    <th className="px-3 py-2 text-right">BS Qty</th>
                    <th className="px-3 py-2 text-right">Sisa</th>
                    <th className="px-3 py-2 text-left">KET</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.slice(0, 500).map((row, i) => (
                    <tr key={i} className={`${ROW_BG[row._status]} hover:brightness-95`}>
                      <td className="px-3 py-1.5 text-xs text-gray-500 whitespace-nowrap">{row.date}</td>
                      <td className="px-3 py-1.5 font-mono text-xs whitespace-nowrap">{row.soNumber}</td>
                      <td className="px-3 py-1.5 text-xs text-gray-500 max-w-[140px] truncate">{row.wilayah}</td>
                      <td className="px-3 py-1.5 font-medium text-gray-800 max-w-[160px] truncate">{row.customer}</td>
                      <td className="px-3 py-1.5 text-xs text-gray-500 max-w-[100px] truncate">{row.sales}</td>
                      <td className="px-3 py-1.5 font-mono text-xs text-gray-400">{row.code}</td>
                      <td className="px-3 py-1.5 text-gray-700 max-w-[160px] truncate">{row.product}</td>
                      <td className="px-3 py-1.5 text-xs text-gray-400 whitespace-nowrap">{row.brand}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{row.qtySO.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                      <td className="px-3 py-1.5 text-xs text-gray-400">{row.unit}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-green-600">{row.qtyKirim.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</td>
                      <td className={`px-3 py-1.5 text-right font-mono font-semibold ${row.qtySisa > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {row.qtySisa.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_COLOR[row._status]}`}>{row._status}</span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length > 500 && (
                    <tr><td colSpan={13} className="px-3 py-2 text-center text-xs text-gray-400">Showing first 500 of {filtered.length.toLocaleString()} rows</td></tr>
                  )}
                  {filtered.length === 0 && (
                    <tr><td colSpan={13} className="px-3 py-8 text-center text-gray-400">No matching delivery records</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {rows.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🚚</div>
          <p className="font-medium">No {tab} delivery data loaded</p>
          <p className="text-sm mt-1">Upload the DELIVERY {tab} sheet above</p>
        </div>
      )}
    </div>
  );
}
