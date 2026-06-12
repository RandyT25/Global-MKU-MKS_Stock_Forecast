import { useAppStore } from '../store/appStore';
import { parseStockCSV } from '../utils/forecast';
import { DataInputPanel } from '../components/DataInputPanel';
import type { Div, StockRow } from '../types';

function StockInputPanel({ div, stock }: { div: Div; stock: StockRow[] }) {
  const { setMkuStock, setMksStock } = useAppStore();

  const handleData = (tsv: string, _mode: 'replace' | 'append') => {
    const rows = parseStockCSV(tsv, div);
    if (!rows.length) {
      return {
        ok: false,
        message: 'Could not parse. Expected columns: Kode_Brg | Nama_Brg | Kode_sat_Std | Saldo Akhir (Std) | [month cols] | Rata-Rata 3 Bulan | Penjualan Tgl…',
      };
    }
    if (div === 'MKU') setMkuStock(rows);
    else setMksStock(rows);
    return { ok: true, message: `${rows.length.toLocaleString()} products loaded for ${div}.` };
  };

  return (
    <div>
      <DataInputPanel
        title={`${div} Stock`}
        rowCount={stock.length}
        showModeToggle={false}
        onData={handleData}
        onClear={() => (div === 'MKU' ? setMkuStock : setMksStock)([])}
        pasteHint={`Kode_Brg\tNama_Brg\tKode_sat_Std\tSaldo Akhir (Std)\t...\nPIF0012\tPristine Classic 1 Lt\tLTR\t18476\t...`}
      />

      {stock.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase">
            Current stock — {stock.length} products
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="text-gray-500 uppercase">
                  <th className="px-3 py-1.5 text-left">Code</th>
                  <th className="px-3 py-1.5 text-left">Name</th>
                  <th className="px-3 py-1.5 text-left">Unit</th>
                  <th className="px-3 py-1.5 text-right">Stock</th>
                  <th className="px-3 py-1.5 text-right">Avg 3M</th>
                  <th className="px-3 py-1.5 text-right">Current Mo.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stock.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-1 font-mono text-gray-400">{r.code}</td>
                    <td className="px-3 py-1 text-gray-700 max-w-xs truncate">{r.name}</td>
                    <td className="px-3 py-1 text-gray-500">{r.unit}</td>
                    <td className="px-3 py-1 text-right font-mono font-semibold">{r.stock.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                    <td className="px-3 py-1 text-right font-mono text-gray-500">{r.avg3M.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                    <td className="px-3 py-1 text-right font-mono text-blue-600">{r.currentMonthSales.toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function StockInput() {
  const { mkuStock, mksStock } = useAppStore();

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Stock Input</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Upload the daily stock file (or paste). Select the correct sheet if prompted — MKU and MKS are separate sheets.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <StockInputPanel div="MKU" stock={mkuStock} />
        <StockInputPanel div="MKS" stock={mksStock} />
      </div>
    </div>
  );
}
