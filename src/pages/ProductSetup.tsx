import { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { ProductSetup as PS } from '../types';

export function ProductSetup() {
  const { productSetups, settings, updateSettings, upsertProductSetup } = useAppStore();
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PS | null>(null);
  const [search, setSearch] = useState('');

  const filtered = productSetups.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (p: PS) => {
    setEditingCode(p.code + p.div);
    setEditForm({ ...p });
  };

  const saveEdit = () => {
    if (!editForm) return;
    upsertProductSetup(editForm);
    setEditingCode(null);
    setEditForm(null);
  };

  const cancelEdit = () => {
    setEditingCode(null);
    setEditForm(null);
  };

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Product Setup</h1>
        <p className="text-sm text-gray-500 mt-0.5">To be completed by Cost Control. Fill in Supplier, Country, and Lead Time to override the 45-day default.</p>
      </div>

      {/* Global Settings */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
        <h2 className="font-semibold text-gray-900 mb-4">Global Settings</h2>
        <div className="grid grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Safety Stock Days
              <span className="ml-1 text-xs text-gray-400">(Safety Stock = Daily Rate × this number)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings.safetyStockDays}
                onChange={e => updateSettings({ safetyStockDays: +e.target.value })}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="text-sm text-gray-500">days</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Safety Buffer %
              <span className="ml-1 text-xs text-gray-400">(increases all demand forecasts)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings.safetyBufferPct}
                onChange={e => updateSettings({ safetyBufferPct: +e.target.value })}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Today's Date
              <span className="ml-1 text-xs text-gray-400">(used for all date calculations)</span>
            </label>
            <input
              type="date"
              value={settings.today}
              onChange={e => updateSettings({ today: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Per-product setup */}
      <div className="flex items-center justify-between mb-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search product or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-3 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        <p className="text-sm text-gray-500">{filtered.length} products</p>
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
                <th className="px-3 py-2.5 text-left">Type</th>
                <th className="px-3 py-2.5 text-right">Safety Stock</th>
                <th className="px-3 py-2.5 text-left">Supplier</th>
                <th className="px-3 py-2.5 text-left">Country</th>
                <th className="px-3 py-2.5 text-right">Lead Time (days)</th>
                <th className="px-3 py-2.5 text-right">Unit Price (Rp)</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => {
                const key = p.code + p.div;
                const isEditing = editingCode === key;
                const f = isEditing ? editForm! : p;

                if (isEditing) {
                  return (
                    <tr key={key} className="bg-blue-50">
                      <td className="px-3 py-1.5">
                        <select value={f.div} onChange={e => setEditForm(prev => ({ ...prev!, div: e.target.value as PS['div'] }))}
                          className="border rounded px-1 py-0.5 text-xs w-16">
                          <option>MKS</option><option>MKU</option>
                        </select>
                      </td>
                      <td className="px-3 py-1.5 font-mono text-xs text-gray-400">{p.code}</td>
                      <td className="px-3 py-1.5 text-gray-700">{p.name}</td>
                      <td className="px-3 py-1.5 text-gray-500">{p.unit}</td>
                      <td className="px-3 py-1.5">
                        <select value={f.type} onChange={e => setEditForm(prev => ({ ...prev!, type: e.target.value }))}
                          className="border rounded px-1 py-0.5 text-xs">
                          <option value="">—</option><option>Imported</option><option>Local</option>
                        </select>
                      </td>
                      <td className="px-3 py-1.5">
                        <input type="number" value={f.safetyStock} onChange={e => setEditForm(prev => ({ ...prev!, safetyStock: +e.target.value }))}
                          className="border rounded px-1 py-0.5 text-xs w-20 text-right" />
                      </td>
                      <td className="px-3 py-1.5">
                        <input value={f.supplier} onChange={e => setEditForm(prev => ({ ...prev!, supplier: e.target.value }))}
                          className="border rounded px-1 py-0.5 text-xs w-28" />
                      </td>
                      <td className="px-3 py-1.5">
                        <input value={f.country} onChange={e => setEditForm(prev => ({ ...prev!, country: e.target.value }))}
                          className="border rounded px-1 py-0.5 text-xs w-20" />
                      </td>
                      <td className="px-3 py-1.5">
                        <input type="number" value={f.leadTime} onChange={e => setEditForm(prev => ({ ...prev!, leadTime: +e.target.value }))}
                          className="border rounded px-1 py-0.5 text-xs w-16 text-right" />
                      </td>
                      <td className="px-3 py-1.5">
                        <input type="number" value={f.unitPrice} onChange={e => setEditForm(prev => ({ ...prev!, unitPrice: +e.target.value }))}
                          className="border rounded px-1 py-0.5 text-xs w-28 text-right" />
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="flex gap-1">
                          <button onClick={saveEdit} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={14} /></button>
                          <button onClick={cancelEdit} className="p-1 text-gray-500 hover:bg-gray-100 rounded"><X size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${p.div === 'MKS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{p.div}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-400">{p.code}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{p.name}</td>
                    <td className="px-3 py-2 text-gray-500">{p.unit}</td>
                    <td className="px-3 py-2">
                      {p.type ? (
                        <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">{p.type}</span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-600">{p.safetyStock > 0 ? p.safetyStock.toFixed(2) : '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{p.supplier || <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-gray-600">{p.country || <span className="text-gray-300">—</span>}</td>
                    <td className={`px-3 py-2 text-right font-mono font-medium ${p.leadTime === 45 ? 'text-gray-400' : 'text-blue-600'}`}>
                      {p.leadTime}d
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-600">
                      {p.unitPrice > 0 ? p.unitPrice.toLocaleString('id-ID') : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => startEdit(p)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="px-3 py-8 text-center text-gray-400">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
