import { SEASONALITY } from '../data/seedData';

export function Seasonality() {
  const max = Math.max(...SEASONALITY.map(s => s.index));

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Seasonality Index</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Index = 1.00 means average month. &gt;1.0 = above average (peak season), &lt;1.0 = below average (low season).
          Based on MKS Bali revenue Jan 2025–Apr 2026.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Monthly Index</h2>
          <div className="space-y-2">
            {SEASONALITY.map(s => {
              const pct = (s.index / max) * 100;
              const isPeak = s.index >= 1.2;
              const isLow = s.index < 0.9;
              return (
                <div key={s.month} className="flex items-center gap-3">
                  <div className="w-8 text-xs text-gray-400 text-right">{s.name.slice(0, 3)}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isPeak ? 'bg-red-400' : isLow ? 'bg-yellow-400' : 'bg-blue-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className={`w-12 text-xs font-bold text-right ${isPeak ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-700'}`}>
                    {s.index.toFixed(3)}
                  </div>
                  {isPeak && <span className="text-xs text-red-500 font-medium">⬆ PEAK</span>}
                  {isLow && <span className="text-xs text-yellow-500 font-medium">⬇ LOW</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
            <span><span className="inline-block w-3 h-3 bg-red-400 rounded-sm mr-1"></span>Peak (&gt;1.2x)</span>
            <span><span className="inline-block w-3 h-3 bg-yellow-400 rounded-sm mr-1"></span>Low (&lt;0.9x)</span>
            <span><span className="inline-block w-3 h-3 bg-blue-400 rounded-sm mr-1"></span>Normal</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Calendar Month Averages</h2>
            <p className="text-xs text-gray-500 mt-0.5">Feed directly into PRODUCT SETUP forecasts</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="px-4 py-2.5 text-left">Month</th>
                <th className="px-4 py-2.5 text-right">Index</th>
                <th className="px-4 py-2.5 text-left">What it means</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {SEASONALITY.map(s => {
                const isPeak = s.index >= 1.2;
                const isLow = s.index < 0.9;
                return (
                  <tr key={s.month} className={`hover:bg-gray-50 ${isPeak ? 'bg-red-50/50' : isLow ? 'bg-yellow-50/50' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{s.name}</td>
                    <td className={`px-4 py-2.5 text-right font-bold ${isPeak ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-700'}`}>
                      {s.index.toFixed(3)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{s.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-5 bg-blue-50 rounded-xl border border-blue-200 p-4 text-sm text-blue-800">
        <h3 className="font-semibold mb-2">How Seasonality Works</h3>
        <ul className="space-y-1 text-xs list-disc list-inside text-blue-700">
          <li>Index is calculated as: Monthly daily revenue ÷ Average daily revenue across all months</li>
          <li>Index &gt; 1.0 means sales are above average that month — order more to prepare</li>
          <li>Index &lt; 1.0 means sales are below average — order less to avoid overstock</li>
          <li><strong>July (1.233) and August (1.218)</strong> are peak months — order ~20% more than normal</li>
          <li><strong>February (0.865)</strong> is the slowest month — order ~14% less than normal</li>
        </ul>
      </div>
    </div>
  );
}
