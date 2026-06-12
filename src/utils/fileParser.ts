import * as XLSX from 'xlsx';

/**
 * Reads an Excel (.xlsx/.xls), CSV, or TSV file and returns tab-separated text.
 * For Excel files, reads the first sheet.
 */
export async function fileToTSV(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
    return file.text();
  }

  // Excel
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false, raw: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  // sheet_to_csv with tab separator gives us TSV; blankrows:false removes empty rows
  return XLSX.utils.sheet_to_csv(sheet, { FS: '\t', blankrows: false });
}

export function getSheetNames(file: File): Promise<string[]> {
  return file.arrayBuffer().then(buffer => {
    const wb = XLSX.read(buffer, { type: 'array' });
    return wb.SheetNames;
  });
}

export async function fileSheetToTSV(file: File, sheetName: string): Promise<string> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false, raw: false });
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return '';
  return XLSX.utils.sheet_to_csv(sheet, { FS: '\t', blankrows: false });
}
