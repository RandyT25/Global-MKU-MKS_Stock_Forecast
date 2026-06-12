import { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { formatRp } from '../utils/forecast';
import type { LostOrder } from '../types';

export function LostOrders() {
  const { lostOrders, addLostOrder, removeLostOrder } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<LostOrder, 'id'>>({
    div: 'MKS', date: '', soNumber: '', customer: '', sales: '', product: '',
    qtyOrdered: 0, unit: '', qtyDelivered: 0, qtyLost: 0, status: 'UNFULFILLED', unitPrice: 0, valueLost: 0,
  });

  const totalLines = lostOrders.length;
  const totalValue = lostOrders.reduce((s, o) => s + o.valueLost, 0);

  const byMonth = useMemo(() => {
    const map: Record<string, { lines: number; value: number }> = {};
    lostOrders.forEach(o => {
      const key = o.date.slice(0, 7);
      if (!map[key]) map[key] = { lines: 0, value: 0 };
      map[key].lines++;
      map[key].value += o.valueLost;
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [lostOrders]);

  const handleAdd = () => {
    if (!form.customer || !form.product) return;
    const qtyLost = form.qtyOrdered - form.qtyDelivered;
    const valueLost = qtyLost * form.unitPrice;
    addLostOrder({ ...form, id: Date.now().toString(), qtyLost, valueLost });
    setForm({ div: 'MKS', date: '', soNumber: '', customer: '', sales: '', product: '', qtyOrdered: 0, unit: '', qtyDelivered: 0, qtyLost: 0, status: 'UNFULFILLED', unitPrice: 0, valueLost: 0 });
    setShowForm(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lost Orders — Unfulfilled Shipments Tracker</h1>
          <p className="text-sm text-gray-500 mt-0.5">All unfulfilled delivery lines across all dates</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={14} /> Add Lost Order
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Lines</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{totalLines}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Unfulfilled</div>
          <div className="text-3xl font-bold text-red-600 mt-1">{lostOrders.filter(o => o.status === 'UNFULFILLED').length}</div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="text-sm text-red-600">Value Lost</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{formatRp(totalValue)}</div>
        </div>
        <div className="bg-white rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="text-sm text-orange-600">YTD Loss (2026)</div>
          <div className="text-2xl font-bold text-orange-700 mt-1">{formatRp(95879645.88)}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Main table */}
        <div className="col-span-3">
          {showForm && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-3">Add Lost Order</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Div', field: 'div', type: 'select', options: ['MKS', 'MKU'] },
                  { label: 'Date', field: 'date', type: 'date' },
                  { label: 'SO Number', field: 'soNumber', type: 'text' },
                  { label: 'Customer', field: 'customer', type: 'text' },
                  { label: 'Sales Rep', field: 'sales', type: 'text' },
                  { label: 'Product', field: 'product', type: 'text' },
                  { label: 'Unit', field: 'unit', type: 'text' },
                  { label: 'Qty Ordered', field: 'qtyOrdered', type: 'number' },
                  { label: 'Qty Delivered', field: 'qtyDelivered', type: 'number' },
                  { label: 'Unit Price (Rp)', field: 'unitPrice', type: 'number' },
                ].map(({ label, field, type, options }) => (
                  <div key={field}>
                    <label className="text-xs text-gray-600 font-medium">{label}</label>
                    {type === 'select' ? (
                      <select value={(form as Record<string, unknown>)[field] as string}
                        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                        className="w-full mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                        {options!.map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={type} value={(form as Record<string, unknown>)[field] as string | number}
                        onChange={e => setForm(f => ({ ...f, [field]: type === 'number' ? +e.target.value : e.target.value }))}
                        className="w-full mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-200">
                    <th className="px-3 py-2.5 text-left">Div</th>
                    <th className="px-3 py-2.5 text-left">Date</th>
                    <th className="px-3 py-2.5 text-left">SO#</th>
                    <th className="px-3 py-2.5 text-left">Customer</th>
                    <th className="px-3 py-2.5 text-left">Product</th>
                    <th className="px-3 py-2.5 text-right">Ordered</th>
                    <th className="px-3 py-2.5 text-right">Delivered</th>
                    <th className="px-3 py-2.5 text-right">Lost</th>
                    <th className="px-3 py-2.5 text-right">Value Lost</th>
                    <th className="px-3 py-2.5 text-left">Status</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lostOrders.map(order => (
                    <tr key={order.id} className="hover:bg-red-50/30">
                      <td className="px-3 py-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${order.div === 'MKS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {order.div}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{order.date}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{order.soNumber}</td>
                      <td className="px-3 py-2 font-medium text-gray-900 max-w-xs truncate">{order.customer}</td>
                      <td className="px-3 py-2 text-gray-700 max-w-xs truncate">{order.product}</td>
                      <td className="px-3 py-2 text-right font-mono">{order.qtyOrdered} {order.unit}</td>
                      <td className="px-3 py-2 text-right font-mono">{order.qtyDelivered}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-red-600">{order.qtyLost}</td>
                      <td className="px-3 py-2 text-right font-medium text-red-700">{formatRp(order.valueLost)}</td>
                      <td className="px-3 py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">{order.status}</span>
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={() => removeLostOrder(order.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {lostOrders.length === 0 && (
                    <tr><td colSpan={11} className="px-3 py-8 text-center text-gray-400">No lost orders recorded</td></tr>
                  )}
                </tbody>
                {lostOrders.length > 0 && (
                  <tfoot>
                    <tr className="bg-red-50 font-medium border-t border-red-200">
                      <td colSpan={8} className="px-3 py-2 text-right text-sm text-gray-600">Total value lost:</td>
                      <td className="px-3 py-2 text-right font-bold text-red-700">{formatRp(totalValue)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Monthly summary */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-fit">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 text-sm">Monthly Loss Summary</h2>
          </div>
          <div className="p-4">
            {byMonth.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No data</p>
            ) : (
              <div className="space-y-2">
                {byMonth.map(([month, data]) => (
                  <div key={month} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-gray-700">{month}</div>
                      <div className="text-xs text-gray-400">{data.lines} lines</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">{formatRp(data.value)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
