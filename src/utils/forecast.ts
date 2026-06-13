import { addDays, differenceInDays, format } from 'date-fns';
import type { StockRow, ProductSetup, NewDeal, ForecastRow, StockStatus, DeliveryRow, PendingPORow, SaleRow, Div } from '../types';

const DEFAULT_LEAD_TIME = 45;
const DAYS_IN_MONTH = 30;
const DAYS_IN_MAR = 31;

function getLeadTime(_code: string, div: string, setups: ProductSetup[]): number {
  const setup = setups.find(s => s.code === _code && s.div === div);
  if (setup && setup.leadTime > 0) return setup.leadTime;
  return DEFAULT_LEAD_TIME;
}

function getNewDealRate(_code: string, product: string, div: string, deals: NewDeal[]): number {
  return deals
    .filter(d => d.div === div && (d.product === product || d.product.includes(product.split(' ')[0])))
    .reduce((sum, d) => sum + (d.expectedVolMonth * (d.confidencePct / 100)) / DAYS_IN_MONTH, 0);
}

function getStatus(stock: number, daysLeft: number, poDeadline: Date | null, today: Date): StockStatus {
  if (stock === 0) return 'OUT OF STOCK';
  if (!poDeadline) return 'OK';
  const daysToDeadline = differenceInDays(poDeadline, today);
  if (daysToDeadline < 0) return 'PO OVERDUE';
  if (daysToDeadline <= 7) return 'ORDER THIS WEEK';
  if (daysToDeadline <= 14) return 'ORDER SOON';
  if (daysLeft <= 30) return 'MONITOR';
  return 'OK';
}

function getActionRank(status: StockStatus, daysLeft: number): number | null {
  if (status === 'OUT OF STOCK') return 1;
  if (status === 'PO OVERDUE') return Math.round(daysLeft * 10);
  if (status === 'ORDER THIS WEEK') return 100;
  if (status === 'ORDER SOON') return 110;
  if (status === 'MONITOR') return 120;
  return null;
}

export function computeForecast(
  stockRows: StockRow[],
  setups: ProductSetup[],
  deals: NewDeal[],
  safetyBufferPct: number,
  today: Date
): ForecastRow[] {
  return stockRows.map(row => {
    const baseRate = row.currentMonthSales > 0
      ? row.currentMonthSales / DAYS_IN_MAR
      : row.avg3M > 0
        ? row.avg3M / DAYS_IN_MONTH
        : 0;

    const newDealRate = getNewDealRate(row.code, row.name, row.div, deals);
    const dailyRate = (baseRate + newDealRate) * (1 + safetyBufferPct / 100);

    const daysLeft = dailyRate > 0 ? row.stock / dailyRate : row.stock > 0 ? 999 : 0;

    const runoutDate = daysLeft === 999
      ? null
      : daysLeft === 0 && row.stock === 0
        ? today
        : addDays(today, Math.floor(daysLeft));

    const leadTime = getLeadTime(row.code, row.div, setups);
    const poDeadline = runoutDate && leadTime > 0 ? addDays(runoutDate, -leadTime) : null;

    const status = getStatus(row.stock, daysLeft, poDeadline, today);
    const actionRank = getActionRank(status, daysLeft);

    return {
      div: row.div,
      code: row.code,
      product: row.name,
      unit: row.unit,
      stock: row.stock,
      pendingPO: 0,
      avg3M: row.avg3M,
      marSales: row.currentMonthSales,
      dailyRate,
      newDealPerDay: newDealRate,
      daysLeft,
      runoutDate: runoutDate ? format(runoutDate, 'dd MMM yyyy') : daysLeft === 999 ? '—' : null,
      poDeadline: poDeadline
        ? differenceInDays(poDeadline, today) < 0
          ? 'OVERDUE'
          : format(poDeadline, 'dd MMM yyyy')
        : null,
      leadTime,
      status,
      actionRank,
    };
  });
}

export function parseStockCSV(text: string, div: 'MKS' | 'MKU'): StockRow[] {
  const rawLines = text.trim().split('\n');
  if (rawLines.length < 2) return [];

  const hi = findHeaderRow(rawLines, ['kode_brg', 'nama_brg', 'saldo', 'rata']);
  const header = toHeader(rawLines[hi]);
  const dataLines = rawLines.slice(hi + 1);

  const codeIdx  = header.findIndex(h => h.includes('kode') && (h.includes('brg') || h === 'kode_brg'));
  const nameIdx  = header.findIndex(h => h.includes('nama') && (h.includes('brg') || h === 'nama_brg'));
  const unitIdx  = header.findIndex(h => h.includes('sat') && (h.includes('std') || h === 'kode_sat_std'));
  const stockIdx = header.findIndex(h => h.includes('saldo'));
  const avg3MIdx = header.findIndex(h => h.includes('rata') && h.includes('3'));
  // "Penjualan Tgl 1 sd 18 Apr 2026" — dynamic date, changes daily
  const currentSaleIdx = header.findIndex(h => h.includes('penjualan') && h.includes('tgl'));

  const MONTH_ABBR = ['jan','feb','mar','apr','mei','may','jun','jul','aug','agu','sep','okt','oct','nov','des','dec'];
  // Handles both "Penjualan 3 Bulan (March 2026)" and bare "Mar" style columns
  const monthCols = header
    .map((h, i) => ({ h, i }))
    .filter(({ h }) =>
      MONTH_ABBR.includes(h) ||
      (h.includes('penjualan') && h.includes('bulan') && !h.includes('rata') && !h.includes('tgl'))
    )
    .map(({ i }) => i)
    .slice(0, 3);

  if (codeIdx === -1 || nameIdx === -1 || stockIdx === -1) return [];

  return dataLines.filter(l => l.trim()).map(line => {
    const cols = line.split('\t');
    const code = cols[codeIdx]?.trim() || '';
    if (!code || code === 'NaN') return null;
    const avg3M = avg3MIdx >= 0 ? parseFloat(cols[avg3MIdx]) || 0 : 0;
    // Use dedicated "Penjualan Tgl" column for current month; fall back to last month column
    const currentMonthSales = currentSaleIdx >= 0
      ? parseFloat(cols[currentSaleIdx]) || 0
      : (monthCols[2] !== undefined ? parseFloat(cols[monthCols[2]]) || 0 : 0);
    return {
      code,
      name: cols[nameIdx]?.trim() || '',
      unit: unitIdx >= 0 ? cols[unitIdx]?.trim() || '' : '',
      stock: parseFloat(cols[stockIdx]) || 0,
      salesJan: monthCols[0] !== undefined ? parseFloat(cols[monthCols[0]]) || 0 : 0,
      salesFeb: monthCols[1] !== undefined ? parseFloat(cols[monthCols[1]]) || 0 : 0,
      salesMar: monthCols[2] !== undefined ? parseFloat(cols[monthCols[2]]) || 0 : 0,
      avg3M,
      currentMonthSales,
      div,
    };
  }).filter((r): r is StockRow => r !== null && !!r.code);
}

export function formatRp(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, decimals = 1): string {
  if (value === 999) return '—';
  return value.toFixed(decimals);
}

// ── Shared header-row detection ───────────────────────────────────────────────
// Indonesian Excel reports often start with 2-4 title/date rows before the
// actual column header. Scans the first `limit` lines and returns the index of
// the line whose cells contain the most keyword matches.
function findHeaderRow(lines: string[], keywords: string[], limit = 12): number {
  let bestLine = 0;
  let bestScore = -1;
  for (let i = 0; i < Math.min(limit, lines.length); i++) {
    const line = lines[i].replace(/^\uFEFF/, '').trim(); // strip BOM
    if (!line) continue;
    const cells = line.split('\t').map(c => c.trim().toLowerCase());
    const score = keywords.filter(kw => cells.some(c => c.includes(kw))).length;
    if (score > bestScore) { bestScore = score; bestLine = i; }
  }
  return bestLine;
}

function toHeader(line: string): string[] {
  return line.replace(/^\uFEFF/, '').split('\t').map(h => h.trim().toLowerCase());
}

// ── Delivery parser ──────────────────────────────────────────────────────────
// Supports both old headers (SO(Kg)/BS(Pcs)/KETERANGAN) and current headers:
// No. Urut | Tgl. Kirim | No. SO | Wilayah | Nama Cust | Nama Sales |
// Kode Brg | Nama Brg | Merk Brg | Qty SO | Satuan | Qty BS | KET
// Rows without a No. Urut value inherit SO/Wilayah/Customer/Sales from the row above.
export function parseDeliveryCSV(text: string, div: Div): DeliveryRow[] {
  const rawLines = text.trim().split('\n');
  if (rawLines.length < 2) return [];

  const hi = findHeaderRow(rawLines, ['urut', 'kirim', 'brg', 'so']);
  const header = toHeader(rawLines[hi]);
  const dataLines = rawLines.slice(hi + 1);

  const idx = {
    seq:      header.findIndex(h => h.includes('urut')),
    date:     header.findIndex(h => h.includes('tgl') || h.includes('kirim')),
    so:       header.findIndex(h => h.includes('no') && h.includes('so')),
    wilayah:  header.findIndex(h => h === 'wilayah'),
    customer: header.findIndex(h => h.includes('customer') || (h.includes('nama') && h.includes('cust'))),
    sales:    header.findIndex(h => h.includes('sales') && !h.includes('so')),
    code:     header.findIndex(h => h.includes('kode') && (h.includes('brg') || h.includes('barang'))),
    product:  header.findIndex(h =>
      (h.includes('nama') && h.includes('barang')) ||
      (h.includes('nama') && h.includes('brg') && !h.includes('merk'))),
    brand:    header.findIndex(h => h.includes('merk')),
    qtySO:    (() => {
      // "SO(Kg)" starts with "so(" | "Qty SO" contains qty+so
      const i = header.findIndex(h => /^so\s*\(/.test(h));
      if (i >= 0) return i;
      const j = header.findIndex(h => h.includes('qty') && h.includes('so'));
      if (j >= 0) return j;
      return header.findIndex(h => h === 'so(kg)' || h === 'so');
    })(),
    unit:     (() => {
      const i = header.findIndex(h => h.includes('sat') && (h.includes('std') || h === 'sat std'));
      if (i >= 0) return i;
      return header.findIndex(h => h === 'satuan' || h === 'sat');
    })(),
    qtyKirim: (() => {
      // "BS(Pcs)" starts with "bs(" | "Qty BS" contains qty+bs
      const i = header.findIndex(h => /^bs\s*\(/.test(h));
      if (i >= 0) return i;
      const j = header.findIndex(h => h.includes('qty') && h.includes('bs'));
      if (j >= 0) return j;
      return header.findIndex(h => h === 'bs(pcs)' || h === 'bs');
    })(),
    ket:      header.findIndex(h => h === 'ket' || h === 'keterangan'),
  };

  if (idx.product === -1) return [];

  const rows: DeliveryRow[] = [];
  let lastDate = '';
  let lastSO = '';
  let lastWilayah = '';
  let lastCustomer = '';
  let lastSales = '';

  dataLines.forEach(line => {
    const cols = line.split('\t');
    const seqVal = idx.seq >= 0 ? cols[idx.seq]?.trim() : '';
    const hasSeq = !!seqVal && /^\d/.test(seqVal);

    if (hasSeq) {
      if (idx.date >= 0)     lastDate     = cols[idx.date]?.trim()     || lastDate;
      if (idx.so >= 0)       lastSO       = cols[idx.so]?.trim()       || lastSO;
      if (idx.wilayah >= 0)  lastWilayah  = cols[idx.wilayah]?.trim()  || lastWilayah;
      if (idx.customer >= 0) lastCustomer = cols[idx.customer]?.trim() || lastCustomer;
      if (idx.sales >= 0)    lastSales    = cols[idx.sales]?.trim()    || lastSales;
    }

    const product = cols[idx.product]?.trim() || '';
    if (!product || product === 'NaN') return;

    const qtySO    = idx.qtySO    >= 0 ? parseIdrNum(cols[idx.qtySO])    : 0;
    const qtyKirim = idx.qtyKirim >= 0 ? parseIdrNum(cols[idx.qtyKirim]) : 0;

    rows.push({
      div,
      date:     lastDate,
      soNumber: lastSO,
      wilayah:  lastWilayah,
      customer: lastCustomer,
      sales:    lastSales,
      code:     idx.code  >= 0 ? cols[idx.code]?.trim()  || '' : '',
      product,
      brand:    idx.brand >= 0 ? cols[idx.brand]?.trim() || '' : '',
      qtySO,
      unit:     idx.unit  >= 0 ? cols[idx.unit]?.trim()  || '' : '',
      qtyKirim,
      qtySisa:  Math.max(0, qtySO - qtyKirim),
      ket:      idx.ket   >= 0 ? cols[idx.ket]?.trim()   || '' : '',
    });
  });

  return rows;
}

// ── Pending PO parser ─────────────────────────────────────────────────────────
// Handles both PENDING MKU/MKS sheet and Ratio MKU/Ratio MKS sheet.
// Headers: Kode_Brg | Nama_Brg | Kode_sat_Std | Saldo Akhir (Std) |
//          <month1> | <month2> | <month3> | Rata - Rata 3 Bulan |
//          Penjualan Tgl … | Tgl_LPB | Qty_LPB | Pending | PR | Ratio 3 Bulan | Ratio Bulan Berjalan
// PR is NaN in the main PENDING sheet — use the "Ratio MKU/MKS" sheet for populated PR values.
export function parsePendingCSV(text: string, div: Div): PendingPORow[] {
  const rawLines = text.trim().split('\n');
  if (rawLines.length < 2) return [];

  const MONTH_ABBR = ['jan','feb','mar','apr','mei','may','jun','jul','aug','agu','sep','okt','oct','nov','des','dec'];

  const hi = findHeaderRow(rawLines, ['kode_brg', 'nama_brg', 'saldo', 'pending', 'ratio']);
  const header = toHeader(rawLines[hi]);
  const dataLines = rawLines.slice(hi + 1);

  const idx = {
    code:        header.findIndex(h => h === 'kode_brg' || (h.includes('kode') && h.includes('brg'))),
    product:     header.findIndex(h => h === 'nama_brg' || (h.includes('nama') && h.includes('brg'))),
    unit:        header.findIndex(h => h === 'kode_sat_std' || h.includes('kode_sat')),
    stock:       header.findIndex(h => h.includes('saldo')),
    avg3M:       header.findIndex(h => h.includes('rata') && h.includes('3')),
    // "Penjualan Tgl 1 sd 09 Jun 2026" — must include 'tgl' to avoid matching 3-month columns
    currentSale: header.findIndex(h => h.includes('penjualan') && h.includes('tgl')),
    tglLPB:      header.findIndex(h => h.includes('tgl') && h.includes('lpb')),
    qtyLPB:      header.findIndex(h => h.includes('qty') && h.includes('lpb')),
    pending:     header.findIndex(h => h === 'pending'),
    pr:          header.findIndex(h => h === 'pr'),
    ratio3M:     header.findIndex(h => h.includes('ratio') && h.includes('3')),
    ratioCurr:   header.findIndex(h => h.includes('ratio') && (h.includes('berjalan') || h.includes('curr'))),
    notes:       header.findIndex(h => h === 'keterangan' || h === 'ket'),
  };

  // Month columns: bare abbr ("Jan") OR "Penjualan 3 Bulan (March 2026)" style
  const monthCols = header
    .map((h, i) => ({ h, i }))
    .filter(({ h }) =>
      MONTH_ABBR.includes(h) ||
      (h.includes('penjualan') && h.includes('bulan') && !h.includes('rata') && !h.includes('tgl'))
    )
    .map(({ i }) => i)
    .slice(0, 3);

  if (idx.code === -1 || idx.product === -1) return [];

  return dataLines.filter(l => l.trim()).map(line => {
    const c = line.split('\t');
    const code    = (idx.code    >= 0 ? c[idx.code]?.trim()    : '') || '';
    const product = (idx.product >= 0 ? c[idx.product]?.trim() : '') || '';
    if ((!code && !product) || code === 'NaN' || product === 'NaN') return null;

    const r3raw = idx.ratio3M   >= 0 ? c[idx.ratio3M]?.trim()   : '';
    const rcRaw = idx.ratioCurr >= 0 ? c[idx.ratioCurr]?.trim() : '';

    return {
      div,
      code,
      product,
      unit:         idx.unit        >= 0 ? c[idx.unit]?.trim()               || '' : '',
      stockBalance: idx.stock       >= 0 ? parseFloat(c[idx.stock])          || 0  : 0,
      month1Sales:  monthCols[0] !== undefined ? parseFloat(c[monthCols[0]]) || 0  : 0,
      month2Sales:  monthCols[1] !== undefined ? parseFloat(c[monthCols[1]]) || 0  : 0,
      month3Sales:  monthCols[2] !== undefined ? parseFloat(c[monthCols[2]]) || 0  : 0,
      avg3M:        idx.avg3M       >= 0 ? parseFloat(c[idx.avg3M])          || 0  : 0,
      currentSales: idx.currentSale >= 0 ? parseFloat(c[idx.currentSale])   || 0  : 0,
      tglLPB:       idx.tglLPB      >= 0 ? c[idx.tglLPB]?.trim()            || '' : '',
      qtyLPB:       idx.qtyLPB      >= 0 ? parseFloat(c[idx.qtyLPB])        || 0  : 0,
      pending:      idx.pending     >= 0 ? parseFloat(c[idx.pending])        || 0  : 0,
      pr:           idx.pr          >= 0 ? parseFloat(c[idx.pr])             || 0  : 0,
      ratio3M:      r3raw && r3raw !== '—' ? parseFloat(r3raw) : null,
      ratioCurrent: rcRaw && rcRaw !== '—' ? parseFloat(rcRaw) : null,
      notes:        idx.notes       >= 0 ? c[idx.notes]?.trim()              || '' : '',
    } as PendingPORow;
  }).filter((r): r is PendingPORow => r !== null);
}

// Parses numbers from Indonesian/Excel exports.
// Handles all common formats:
//   Indonesian/European thousands: 1.635.000 | 1.635.000,89
//   US format (comma thousands, dot decimal): 1,635,000 | 1,635,000.89
//   Plain: 1635000 | 1635000.89 | 2,00 (comma-decimal)
function parseIdrNum(s: string): number {
  const str = (s || '').trim().replace(/[^0-9.,eE+\-]/g, '');
  if (!str) return 0;
  if (/[eE]/.test(str)) return parseFloat(str) || 0;

  const dots = (str.match(/\./g) || []).length;

  // Multiple dots → Indonesian/European thousands (1.234.567 or 1.234.567,89)
  if (dots > 1) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }

  if (dots === 1 && str.includes(',')) {
    // Single dot + comma(s): position determines which is the decimal separator
    if (str.lastIndexOf(',') < str.lastIndexOf('.')) {
      // US format: commas are thousands separators, dot is decimal (1,234,567.89)
      return parseFloat(str.replace(/,/g, '')) || 0;
    }
    // Indonesian: dot is thousands, comma is decimal (1.234,89)
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  }

  if (!str.includes('.') && str.includes(',')) {
    const parts = str.split(',');
    // Multiple commas OR single comma with exactly 3 trailing digits → US thousands
    if (parts.length > 2 || (parts.length === 2 && (parts[1]?.length ?? 0) === 3)) {
      return parseFloat(str.replace(/,/g, '')) || 0;
    }
    // Single comma with 1–2 digits → decimal separator (2,00 = 2.00)
    return parseFloat(str.replace(',', '.')) || 0;
  }

  return parseFloat(str) || 0;
}

// ── Sales Global parser ────────────────────────────────────────────────────────
// Real headers: Nama_Wil | Kode_Cust | Nama Cust | Grup Cust | Kode_Brg | Nama Brg |
//               Kategori Barang | Qty | DPP | PPN | Grand Total | Sales | Tipe_Order |
//               bulan | nama bulan | Nama_Div | tahun
// Amount column: DPP (taxable base), fallback to Grand Total then Total
export function parseSalesCSV(text: string): SaleRow[] {
  const rawLines = text.trim().split('\n');
  if (rawLines.length < 2) return [];

  const hi = findHeaderRow(rawLines, ['nama cust', 'kode_brg', 'dpp', 'bulan', 'tahun', 'tipe_order']);
  const header = toHeader(rawLines[hi]);
  const dataLines = rawLines.slice(hi + 1);

  const idx = {
    customer:  header.findIndex(h => h.includes('nama') && h.includes('cust')),
    code:      header.findIndex(h => h.includes('kode') && h.includes('brg')),
    product:   header.findIndex(h => h.includes('nama') && (h.includes('brg') || h.includes('barang'))),
    qty:       header.findIndex(h => h === 'qty'),
    total:     (() => {
      const dpp = header.findIndex(h => h === 'dpp' || h.startsWith('dpp'));
      if (dpp >= 0) return dpp;
      const gt = header.findIndex(h => h.includes('grand') && h.includes('total'));
      if (gt >= 0) return gt;
      return header.findIndex(h => h === 'total');
    })(),
    sales:     header.findIndex(h => h === 'sales'),
    type:      header.findIndex(h => h.includes('tipe') && h.includes('order')),
    month:     header.findIndex(h => h === 'bulan'),
    monthName: header.findIndex(h => h.includes('nama') && h.includes('bulan')),
    div:       header.findIndex(h => h.includes('nama') && h.includes('div')),
    year:      header.findIndex(h => h === 'tahun' || h === 'year'),
  };

  if (idx.customer === -1 || idx.product === -1) return [];

  return dataLines.filter(l => l.trim()).map(line => {
    const c = line.split('\t');
    const customer = c[idx.customer]?.trim() || '';
    if (!customer || customer === 'NaN') return null;
    return {
      customer,
      code:      idx.code      >= 0 ? c[idx.code]?.trim()      || '' : '',
      product:   c[idx.product]?.trim() || '',
      qty:       idx.qty       >= 0 ? parseIdrNum(c[idx.qty])   : 0,
      total:     idx.total     >= 0 ? parseIdrNum(c[idx.total]) : 0,
      sales:     idx.sales     >= 0 ? c[idx.sales]?.trim()     || '' : '',
      orderType: idx.type      >= 0 ? c[idx.type]?.trim()      || '' : '',
      month:     idx.month     >= 0 ? parseInt(c[idx.month])   || 0  : 0,
      monthName: idx.monthName >= 0 ? c[idx.monthName]?.trim() || '' : '',
      div:       idx.div       >= 0 ? c[idx.div]?.trim()       || '' : '',
      year:      idx.year      >= 0 ? parseInt(c[idx.year])    || 0  : 0,
    } as SaleRow;
  }).filter((r): r is SaleRow => r !== null);
}
