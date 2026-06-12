import { useState, useRef, useCallback } from 'react';
import { Upload, FileUp, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { fileToTSV, getSheetNames, fileSheetToTSV } from '../utils/fileParser';

interface DataInputPanelProps {
  title: string;
  rowCount: number;
  mode?: 'replace' | 'append';
  showModeToggle?: boolean;
  onMode?: (m: 'replace' | 'append') => void;
  onData: (tsv: string, mode: 'replace' | 'append') => { ok: boolean; message: string };
  onClear: () => void;
  pasteHint?: string;
}

export function DataInputPanel({
  title, rowCount, showModeToggle = true, onData, onClear, pasteHint,
}: DataInputPanelProps) {
  const [mode, setMode] = useState<'replace' | 'append'>('replace');
  const [paste, setPaste] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedSheet, setSelectedSheet] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File, sheet?: string) => {
    setLoading(true);
    setStatus(null);
    try {
      // Multi-sheet Excel: always ask user to pick a sheet (even for 2 sheets)
      if (!sheet && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
        const names = await getSheetNames(file);
        if (names.length > 1) {
          setSheetNames(names);
          setSelectedSheet(names[0]);
          setPendingFile(file);
          setLoading(false);
          return;
        }
      }
      const tsv = sheet
        ? await fileSheetToTSV(file, sheet)
        : await fileToTSV(file);
      const result = onData(tsv, mode);
      if (!result.ok) {
        // Append first-row preview to help debug column mismatches
        const firstRow = tsv.split('\n').slice(0, 3).map(l =>
          l.split('\t').map(c => c.trim()).filter(Boolean).join(' | ')
        ).filter(Boolean).join('\n');
        setStatus({ ok: false, msg: `${result.message}\n\nFirst rows read:\n${firstRow}` });
      } else {
        setStatus({ ok: true, msg: result.message });
      }
    } catch (e) {
      setStatus({ ok: false, msg: `Read error: ${e instanceof Error ? e.message : String(e)}` });
    }
    setLoading(false);
  }, [mode, onData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleSheetConfirm = () => {
    if (pendingFile && selectedSheet) {
      processFile(pendingFile, selectedSheet);
      setPendingFile(null);
      setSheetNames([]);
    }
  };

  const handlePasteApply = () => {
    if (!paste.trim()) { setStatus({ ok: false, msg: 'Paste some data first.' }); return; }
    const result = onData(paste, mode);
    if (!result.ok) {
      const firstRow = paste.split('\n').slice(0, 3).map(l =>
        l.split('\t').map(c => c.trim()).filter(Boolean).join(' | ')
      ).filter(Boolean).join('\n');
      setStatus({ ok: false, msg: `${result.message}\n\nFirst rows read:\n${firstRow}` });
    } else {
      setStatus({ ok: true, msg: result.message });
      setPaste('');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {rowCount > 0 && <p className="text-xs text-gray-400 mt-0.5">{rowCount.toLocaleString()} rows loaded</p>}
        </div>
        <div className="flex items-center gap-3">
          {showModeToggle && (
            <div className="flex items-center gap-1 text-xs bg-gray-100 rounded-lg p-1">
              <button onClick={() => setMode('replace')}
                className={`px-2.5 py-1 rounded-md transition-colors ${mode === 'replace' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                Replace
              </button>
              <button onClick={() => setMode('append')}
                className={`px-2.5 py-1 rounded-md transition-colors ${mode === 'append' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                Append
              </button>
            </div>
          )}
          {rowCount > 0 && (
            <button onClick={() => { onClear(); setStatus(null); }}
              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* File drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-8 cursor-pointer transition-colors select-none ${
          dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        }`}
      >
        {loading ? (
          <div className="text-sm text-blue-600 animate-pulse">Reading file…</div>
        ) : (
          <>
            <FileUp size={28} className="text-gray-300" />
            <div className="text-sm font-medium text-gray-600">Drop Excel / CSV file here</div>
            <div className="text-xs text-gray-400">or click to choose  ·  .xlsx  .xls  .csv  .tsv</div>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.tsv,.txt" className="hidden" onChange={handleFileChange} />

      {/* Sheet picker for multi-sheet workbooks */}
      {sheetNames.length > 0 && (
        <div className="mt-3 flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-800 font-medium">Select sheet:</span>
          <div className="relative">
            <select value={selectedSheet} onChange={e => setSelectedSheet(e.target.value)}
              className="text-sm border border-blue-200 rounded-lg px-3 py-1.5 pr-8 bg-white focus:outline-none appearance-none">
              {sheetNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-2.5 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={handleSheetConfirm}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            Load
          </button>
          <button onClick={() => { setSheetNames([]); setPendingFile(null); }}
            className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
        </div>
      )}

      {/* Status */}
      {status && (
        <div className={`flex items-start gap-2 mt-3 p-3 rounded-lg text-sm ${status.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {status.ok ? <CheckCircle size={14} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />}
          <span className="whitespace-pre-wrap">{status.msg}</span>
        </div>
      )}

      {/* Paste fallback (collapsed by default) */}
      <div className="mt-3">
        <button onClick={() => setShowPaste(p => !p)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600">
          <ChevronDown size={12} className={`transition-transform ${showPaste ? 'rotate-180' : ''}`} />
          Or paste data manually
        </button>
        {showPaste && (
          <div className="mt-2">
            <textarea
              value={paste}
              onChange={e => setPaste(e.target.value)}
              placeholder={pasteHint || 'Paste tab-separated data from Excel…'}
              rows={4}
              className="w-full text-xs font-mono border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            <button onClick={handlePasteApply}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Upload size={14} /> Apply Paste
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
