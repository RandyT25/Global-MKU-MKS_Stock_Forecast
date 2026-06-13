import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import type { ProductSetup as PS } from '../types';
import { formatRp } from '../utils/forecast';

type EditableField = 'type' | 'safetyStock' | 'supplier' | 'country' | 'leadTime' | 'unitPrice';
const NUM_FIELDS: EditableField[] = ['safetyStock', 'leadTime', 'unitPrice'];

function EditableCell({
  value, field, rowKey, activeKey, onActivate, onCommit, onCancel,
}: {
  value: string | number;
  field: EditableField;
  rowKey: string;
  activeKey: string | null;
  onActivate: () => void;
  onCommit: (val: string) => void;
  onCancel: () => void;
}) {
  const isActive = activeKey === rowKey + field;
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive) {
      setDraft(String(value ?? ''));
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [isActive, value]);

  if (isActive) {
    return (
      <input
        ref={inputRef}
        type={NUM_FIELDS.includes(field) ? 'number' : 'text'}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => onCommit(draft)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); onCommit(draft); }
          if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
          if (e.key === 'Tab') { onCommit(draft); }
        }}
        className="w-full border border-blue-400 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        style={{ minWidth: NUM_FIELDS.includes(field) ? 72 : 110 }}
      />
    );
  }

  const display = () => {
    if (field === 'unitPrice') return value ? formatRp(Number(value)) : <span className="text-gray-300">—</span>;
    if (field === 'leadTime') return <span className={Number(value) === 45 ? 'text-gray-400' : 'text-blue-600'}>{value}d</span>;
    if (field === 'safetyStock') return Number(value) > 0 ? Number(value).toFixed(2) : <span className="text-gray-300">—</span>;
    if (field === 'type') return value
      ? <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">{value}</span>
      : <span className="text-gray-300">—</span>;
    return value || <span className="text-gray-300">—</span>;
  };

  return (
    <div
      onClick={onActivate}
      title="Click to edit"
      className="cursor-text rounded px-1 -mx-1 py-0.5 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 transition-colors min-h-[1.5rem] flex items-center"
    >
      {display()}
    </div>
  );
}

function SelectCell({
  value, field, options, rowKey, activeKey, onActivate, onCommit, onCancel,
}: {
  value: string;
  field: EditableField;
  options: { label: string; value: string }[];
  rowKey: string;
  activeKey: string | null;
  onActivate: () => void;
  onCommit: (val: string) => void;
  onCancel: () => void;
}) {
  const isActive = activeKey === rowKey + field;
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isActive) setTimeout(() => selectRef.current?.focus(), 0);
  }, [isActive]);

  if (isActive) {
    return (
      <select
        ref={selectRef}
        value={value}
        onChange={e => { onCommit(e.target.value); }}
        onBlur={() => onCancel()}
        onKeyDown={e => { if (e.key === 'Escape') onCancel(); }}
        className="border border-blue-400 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  const label = options.find(o => o.value === value)?.label ?? value;
  return (
    <div
      onClick={onActivate}
      title="Click to edit"
      className="cursor-pointer rounded px-1 -mx-1 py-0.5 hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 transition-colors min-h-[1.5rem] flex items-center gap-1"
    >
      {value
        ? <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">{label}</span>
        : <span className="text-gray-300">—</span>}
      <span className="text-gray-300 text-[10px]">▾</span>
    </div>
  );
}

export function ProductSetup() {
  const { productSetups, settings, updateSettings, upsertProductSetup } = useAppStore();
  const [search, setSearch] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const filtered = productSetups.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const commit = (p: PS, field: EditableField, val: string) => {
    const updated: PS = {
      ...p,
      [field]: NUM_FIELDS.includes(field) ? +val : val,
    };
    upsertProductSetup(updated);
    setActiveKey(null);
  };

  const cancel = () => setActiveKey(null);

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Product Setup</h1>
        <p className="text-sm text-gray-500 mt-0.5">Click any highlighted cell to edit. Changes save automatically on Enter or click-away.</p>
      </div>

      {/* Global Settings */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
        <h2 className="font-semibold text-gray-900 mb-4">Global Settings</h2>
        <div className="grid grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Safety Stock Days
              <span className="ml-1 text-xs text-gray-400">(Daily Rate × this)</span>
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
              <span className="ml-1 text-xs text-gray-400">(boosts all demand)</span>
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
              <span className="ml-1 text-xs text-gray-400">(used for date calculations)</span>
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

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <input
          type="text"
          placeholder="Search product or code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-3 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
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
                <th className="px-3 py-2.5 text-left w-28">Type</th>
                <th className="px-3 py-2.5 text-right w-28">Safety Stock</th>
                <th className="px-3 py-2.5 text-left w-36">Supplier</th>
                <th className="px-3 py-2.5 text-left w-24">Country</th>
                <th className="px-3 py-2.5 text-right w-28">Lead Time</th>
                <th className="px-3 py-2.5 text-right w-36">Unit Price (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => {
                const rk = p.code + p.div;
                return (
                  <tr key={rk} className="hover:bg-gray-50/60">
                    <td className="px-3 py-1.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${p.div === 'MKS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {p.div}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 font-mono text-xs text-gray-400">{p.code}</td>
                    <td className="px-3 py-1.5 font-medium text-gray-800 max-w-[220px] truncate" title={p.name}>{p.name}</td>
                    <td className="px-3 py-1.5 text-gray-500">{p.unit}</td>
                    <td className="px-3 py-1.5">
                      <SelectCell
                        value={p.type} field="type" rowKey={rk} activeKey={activeKey}
                        options={[{ label: '—', value: '' }, { label: 'Imported', value: 'Imported' }, { label: 'Local', value: 'Local' }]}
                        onActivate={() => setActiveKey(rk + 'type')}
                        onCommit={v => commit(p, 'type', v)}
                        onCancel={cancel}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <EditableCell
                        value={p.safetyStock} field="safetyStock" rowKey={rk} activeKey={activeKey}
                        onActivate={() => setActiveKey(rk + 'safetyStock')}
                        onCommit={v => commit(p, 'safetyStock', v)}
                        onCancel={cancel}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-gray-600">
                      <EditableCell
                        value={p.supplier} field="supplier" rowKey={rk} activeKey={activeKey}
                        onActivate={() => setActiveKey(rk + 'supplier')}
                        onCommit={v => commit(p, 'supplier', v)}
                        onCancel={cancel}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-gray-600">
                      <EditableCell
                        value={p.country} field="country" rowKey={rk} activeKey={activeKey}
                        onActivate={() => setActiveKey(rk + 'country')}
                        onCommit={v => commit(p, 'country', v)}
                        onCancel={cancel}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <EditableCell
                        value={p.leadTime} field="leadTime" rowKey={rk} activeKey={activeKey}
                        onActivate={() => setActiveKey(rk + 'leadTime')}
                        onCommit={v => commit(p, 'leadTime', v)}
                        onCancel={cancel}
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <EditableCell
                        value={p.unitPrice} field="unitPrice" rowKey={rk} activeKey={activeKey}
                        onActivate={() => setActiveKey(rk + 'unitPrice')}
                        onCommit={v => commit(p, 'unitPrice', v)}
                        onCancel={cancel}
                      />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-400">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
