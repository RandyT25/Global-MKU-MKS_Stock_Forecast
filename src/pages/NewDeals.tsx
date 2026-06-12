import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { NewDeal, DealStage, Div } from '../types';

const STAGE_COLORS: Record<DealStage, string> = {
  'Confirmed': 'bg-emerald-100 text-emerald-800',
  'Sample Given': 'bg-blue-100 text-blue-800',
  'Prospect': 'bg-yellow-100 text-yellow-800',
  'Cancelled': 'bg-gray-100 text-gray-500',
};

const STAGE_CONFIDENCE: Record<DealStage, number> = {
  'Confirmed': 100,
  'Sample Given': 50,
  'Prospect': 20,
  'Cancelled': 0,
};

function DealRow({ deal, onUpdate, onRemove }: {
  deal: NewDeal;
  onUpdate: (id: string, d: Partial<NewDeal>) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(deal);

  const save = () => {
    onUpdate(deal.id, form);
    setEditing(false);
  };

  const cancel = () => {
    setForm(deal);
    setEditing(false);
  };

  const weightedVol = deal.expectedVolMonth * (deal.confidencePct / 100);

  if (editing) {
    return (
      <tr className="bg-blue-50">
        <td className="px-3 py-2">
          <select value={form.div} onChange={e => setForm(f => ({ ...f, div: e.target.value as Div }))}
            className="border rounded px-1 py-0.5 text-xs w-16">
            <option>MKS</option><option>MKU</option>
          </select>
        </td>
        <td className="px-3 py-2">
          <input value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
            className="border rounded px-2 py-0.5 text-xs w-full" />
        </td>
        <td className="px-3 py-2">
          <input value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
            className="border rounded px-2 py-0.5 text-xs w-full" />
        </td>
        <td className="px-3 py-2">
          <input type="number" value={form.expectedVolMonth} onChange={e => setForm(f => ({ ...f, expectedVolMonth: +e.target.value }))}
            className="border rounded px-2 py-0.5 text-xs w-20 text-right" />
        </td>
        <td className="px-3 py-2">
          <select value={form.dealStage} onChange={e => {
            const stage = e.target.value as DealStage;
            setForm(f => ({ ...f, dealStage: stage, confidencePct: STAGE_CONFIDENCE[stage] }));
          }} className="border rounded px-1 py-0.5 text-xs">
            {(['Confirmed', 'Sample Given', 'Prospect', 'Cancelled'] as DealStage[]).map(s => <option key={s}>{s}</option>)}
          </select>
        </td>
        <td className="px-3 py-2">
          <input type="number" value={form.confidencePct} onChange={e => setForm(f => ({ ...f, confidencePct: +e.target.value }))}
            className="border rounded px-2 py-0.5 text-xs w-16 text-right" />
        </td>
        <td className="px-3 py-2">
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="border rounded px-2 py-0.5 text-xs w-full" />
        </td>
        <td className="px-3 py-2">
          <div className="flex gap-1">
            <button onClick={save} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={14} /></button>
            <button onClick={cancel} className="p-1 text-gray-500 hover:bg-gray-100 rounded"><X size={14} /></button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`hover:bg-gray-50 ${deal.dealStage === 'Cancelled' ? 'opacity-50' : ''}`}>
      <td className="px-3 py-2">
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${deal.div === 'MKS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
          {deal.div}
        </span>
      </td>
      <td className="px-3 py-2 font-medium text-gray-900">{deal.customer}</td>
      <td className="px-3 py-2 text-gray-700 max-w-xs truncate" title={deal.product}>{deal.product}</td>
      <td className="px-3 py-2 text-right font-mono text-gray-700">{deal.expectedVolMonth}</td>
      <td className="px-3 py-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[deal.dealStage]}`}>
          {deal.dealStage}
        </span>
      </td>
      <td className="px-3 py-2 text-right font-mono text-gray-700">{deal.confidencePct}%</td>
      <td className="px-3 py-2 text-right font-mono text-blue-700 font-medium">{weightedVol.toFixed(0)}</td>
      <td className="px-3 py-2 text-gray-500 text-xs">{deal.notes}</td>
      <td className="px-3 py-2">
        <div className="flex gap-1">
          <button onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={13} /></button>
          <button onClick={() => onRemove(deal.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

export function NewDeals() {
  const { deals, addDeal, updateDeal, removeDeal } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<NewDeal, 'id'>>({
    customer: '', product: '', div: 'MKS', expectedVolMonth: 0,
    dealStage: 'Confirmed', confidencePct: 100, startDate: '', notes: '',
  });

  const handleAdd = () => {
    if (!form.customer || !form.product) return;
    addDeal({ ...form, id: Date.now().toString() });
    setForm({ customer: '', product: '', div: 'MKS', expectedVolMonth: 0, dealStage: 'Confirmed', confidencePct: 100, startDate: '', notes: '' });
    setShowForm(false);
  };

  const totalWeightedVol = deals.filter(d => d.dealStage !== 'Cancelled')
    .reduce((s, d) => s + d.expectedVolMonth * (d.confidencePct / 100), 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Deals & Pipeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Sales team adds confirmed or expected deals here. The Forecast Engine adds this volume to demand automatically.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={14} />
          Add Deal
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {(['Confirmed', 'Sample Given', 'Prospect', 'Cancelled'] as DealStage[]).map(stage => {
          const stageDeals = deals.filter(d => d.dealStage === stage);
          const vol = stageDeals.reduce((s, d) => s + d.expectedVolMonth * (d.confidencePct / 100), 0);
          return (
            <div key={stage} className="bg-white rounded-lg border border-gray-200 p-3">
              <div className={`inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[stage]} mb-2`}>{stage}</div>
              <div className="text-2xl font-bold text-gray-900">{stageDeals.length}</div>
              <div className="text-xs text-gray-500">{vol.toFixed(0)} units/mo weighted</div>
            </div>
          );
        })}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 mb-4">
          <h3 className="font-semibold text-blue-900 mb-3">New Deal</h3>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-600 font-medium">Customer *</label>
              <input value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
                className="w-full mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-600 font-medium">Product *</label>
              <input value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
                className="w-full mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">Division</label>
              <select value={form.div} onChange={e => setForm(f => ({ ...f, div: e.target.value as Div }))}
                className="w-full mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option>MKS</option><option>MKU</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">Expected Vol/Month</label>
              <input type="number" value={form.expectedVolMonth} onChange={e => setForm(f => ({ ...f, expectedVolMonth: +e.target.value }))}
                className="w-full mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">Deal Stage</label>
              <select value={form.dealStage} onChange={e => {
                const stage = e.target.value as DealStage;
                setForm(f => ({ ...f, dealStage: stage, confidencePct: STAGE_CONFIDENCE[stage] }));
              }} className="w-full mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                {(['Confirmed', 'Sample Given', 'Prospect', 'Cancelled'] as DealStage[]).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">Confidence %</label>
              <input type="number" value={form.confidencePct} onChange={e => setForm(f => ({ ...f, confidencePct: +e.target.value }))}
                className="w-full mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="col-span-4">
              <label className="text-xs text-gray-600 font-medium">Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add Deal</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Deal Stage Guide */}
      <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
        {[
          { stage: 'Confirmed', pct: '100%', desc: 'Signed or PO received — full volume included' },
          { stage: 'Sample Given', pct: '50%', desc: 'Negotiating after sample — half volume included' },
          { stage: 'Prospect', pct: '20%', desc: 'First visit, interested — 20% of volume included' },
          { stage: 'Cancelled', pct: '0%', desc: 'Deal fell through — excluded from forecast' },
        ].map(g => (
          <div key={g.stage} className={`p-2 rounded border ${STAGE_COLORS[g.stage as DealStage]}`}>
            <span className="font-semibold">{g.stage}</span> <span className="opacity-70">({g.pct})</span>
            <div className="text-gray-600 mt-0.5">{g.desc}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-200">
                <th className="px-3 py-2.5 text-left">Div</th>
                <th className="px-3 py-2.5 text-left">Customer</th>
                <th className="px-3 py-2.5 text-left">Product</th>
                <th className="px-3 py-2.5 text-right">Vol/Mo</th>
                <th className="px-3 py-2.5 text-left">Stage</th>
                <th className="px-3 py-2.5 text-right">Confidence</th>
                <th className="px-3 py-2.5 text-right">Weighted Vol</th>
                <th className="px-3 py-2.5 text-left">Notes</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deals.map(deal => (
                <DealRow key={deal.id} deal={deal} onUpdate={updateDeal} onRemove={removeDeal} />
              ))}
              {deals.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">No deals added yet</td></tr>
              )}
            </tbody>
            {deals.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-medium">
                  <td colSpan={6} className="px-3 py-2 text-right text-sm text-gray-600">Total weighted volume/month:</td>
                  <td className="px-3 py-2 text-right font-bold text-blue-700">{totalWeightedVol.toFixed(0)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
