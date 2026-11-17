import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Play,
  UploadCloud,
} from 'lucide-react';
import type {
  BulkImportHistoryItem,
  BulkImportPreviewRow,
  BulkImportResult,
  BulkImportTab,
} from '@/types/admin';
import {
  downloadBulkTemplate,
  downloadErrorReport,
  executeBulkImport,
  exportAllProductsCsv,
  getImportHistory,
  parseAndValidateCsv,
} from '@/lib/api/admin/bulkImport';
import { formatDateTime, formatINR } from '@/lib/api/admin/client';
import { useAuth } from '@/components/admin/AuthContext';
import { useToast } from '@/components/admin/ToastProvider';
import { StatusBadge } from '@/components/admin/StatusBadge';

const SAMPLE_TEST_CSV_WITH_ERRORS = `sku,name,category_path,brand_name,price,mrp,stock,gst_percent,hsn_code
BDM-NEB-101,Yuwell Ultrasonic Mesh Nebulizer,Respiratory Care > Oxygen Therapy > Oxygen Concentrators,Yuwell Medical,3450,4500,20,12,90192010
,Missing SKU Portable Suction Unit,Dental Equipment > Dental Operatory > Dental Chairs,Gnatus Dental,18500,22000,5,12,90184900
BDM-OXY-5L-01,Duplicate Existing SKU Concentrator,Respiratory Care > Oxygen Therapy > Oxygen Concentrators,Yuwell Medical,41000,52000,4,12,90192010
BDM-ECG-300,Contec 3-Channel Digital ECG,Unknown Category > Monitors,Contec Medical,-1200,32000,8,12,90181100
BDM-STETH-PRO,CardioPro Clinical Stethoscope,Patient Monitoring > Vital Signs Monitors > Multiparameter Monitors,Contec Medical,4200,5200,35,12,90189099`;

export function BulkImportPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<BulkImportTab>('import_products');
  const [fileName, setFileName] = useState('');
  const [previewRows, setPreviewRows] = useState<BulkImportPreviewRow[]>([]);
  const [importValidOnly, setImportValidOnly] = useState(true);
  const [progress, setProgress] = useState<number>(0);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [history, setHistory] = useState<BulkImportHistoryItem[]>([]);

  useEffect(() => {
    getImportHistory().then(setHistory).catch(() => {});
  }, []);

  const validCount = previewRows.filter((r) => r.valid).length;
  const invalidCount = previewRows.length - validCount;

  const processCsvText = async (name: string, text: string) => {
    if (activeTab === 'export_products') return;
    setResult(null);
    setProgress(0);
    try {
      const rows = await parseAndValidateCsv(text, activeTab);
      setFileName(name);
      setPreviewRows(rows);
      showToast({
        title: `Parsed ${rows.length} rows`,
        description: `${rows.filter((r) => r.valid).length} valid · ${rows.filter((r) => !r.valid).length} with errors`,
        variant: rows.some((r) => !r.valid) ? 'warning' : 'success',
      });
    } catch (err) {
      showToast({
        title: 'Unable to parse CSV',
        description: err instanceof Error ? err.message : 'Invalid file format',
        variant: 'error',
      });
    }
  };

  const handleFileUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      processCsvText(file.name, String(reader.result || ''));
    };
    reader.readAsText(file);
  };

  const handleRunImport = async () => {
    if (activeTab === 'export_products' || previewRows.length === 0) return;
    setImporting(true);
    setProgress(25);
    const interval = window.setInterval(() => {
      setProgress((p) => Math.min(90, p + 22));
    }, 90);

    try {
      const res = await executeBulkImport({
        fileName: fileName || 'bulk-upload.csv',
        mode: activeTab,
        rows: previewRows,
        importValidOnly,
        uploadedBy: user?.name || 'Admin',
      });
      window.clearInterval(interval);
      setProgress(100);
      setResult(res);
      setHistory(await getImportHistory());
      showToast({
        title: 'Bulk import finished',
        description: `Created ${res.createdCount}, Updated ${res.updatedCount}, Failed ${res.failedCount}`,
        variant: res.failedCount > 0 ? 'warning' : 'success',
      });
    } catch (err) {
      window.clearInterval(interval);
      setProgress(0);
      showToast({
        title: 'Import blocked',
        description: err instanceof Error ? err.message : 'Fix validation errors first',
        variant: 'error',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#12263F] tracking-tight">Bulk Import &amp; Export</h1>
        <p className="mt-0.5 text-sm text-[#5B6B82]">
          Batch create products, update SKU prices &amp; stock, validate rows before commit, or export catalog CSV.
        </p>
      </div>

      {/* Tabs */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-[#DCE6F2] bg-white p-1.5">
        {(
          [
            { key: 'import_products', label: 'Import Products' },
            { key: 'update_prices_stock', label: 'Update Prices & Stock' },
            { key: 'export_products', label: 'Export Products' },
          ] as { key: BulkImportTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setPreviewRows([]);
              setResult(null);
              setProgress(0);
            }}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-[#1D5FAF] text-white'
                : 'text-[#5B6B82] hover:bg-[#EAF2FC] hover:text-[#12263F]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'export_products' ? (
        <div className="rounded-xl border border-[#DCE6F2] bg-white p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FC] text-[#1D5FAF]">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-[#12263F]">
                Export Complete Product Catalog (CSV)
              </h2>
              <p className="text-xs text-[#5B6B82] max-w-xl">
                Includes SKU, Name, Brand, 3-level Category Path, Selling Price, MRP, GST %, HSN Code,
                Available Stock, Status, and EMI / Rent / COD flags.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              exportAllProductsCsv();
              showToast({ title: 'Catalog CSV exported', variant: 'success' });
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1D5FAF] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#174D8F]"
          >
            <Download className="h-4 w-4" />
            Download Products CSV
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Upload + Template Card */}
          <div className="rounded-xl border border-[#DCE6F2] bg-white p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#12263F]">
                  {activeTab === 'import_products'
                    ? 'Step 1: Upload Product CSV'
                    : 'Step 1: Upload Price & Stock CSV'}
                </h2>
                <p className="text-xs text-[#5B6B82]">
                  Download our formatted CSV template, fill rows, and upload for automated validation.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadBulkTemplate(activeTab)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE6F2] bg-white px-3.5 py-2 text-xs font-semibold text-[#12263F] hover:bg-[#EAF2FC]"
                >
                  <Download className="h-3.5 w-3.5 text-[#1D5FAF]" />
                  Download Sample CSV Template
                </button>
                {activeTab === 'import_products' && (
                  <button
                    type="button"
                    onClick={() =>
                      processCsvText(
                        'sample-mixed-validation.csv',
                        SAMPLE_TEST_CSV_WITH_ERRORS
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#F28C38]/40 bg-[#F28C38]/10 px-3.5 py-2 text-xs font-semibold text-[#B85A0E] hover:bg-[#F28C38]/20"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Load Test CSV (With Errors)
                  </button>
                )}
              </div>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files?.[0]);
              }}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#DCE6F2] bg-[#F6F9FD] px-6 py-8 text-center"
            >
              <UploadCloud className="h-7 w-7 text-[#1D5FAF]" />
              <p className="mt-2.5 text-sm font-semibold text-[#12263F]">
                {fileName ? `Loaded: ${fileName}` : 'Drop your CSV file here or browse'}
              </p>
              <p className="mt-1 text-xs text-[#5B6B82]">
                Validates missing SKU, invalid category path, duplicate SKU, and invalid price/MRP.
              </p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-4 rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F]"
              >
                Select CSV File
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  handleFileUpload(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          {/* Preview Table */}
          {previewRows.length > 0 && (
            <div className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE6F2] px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-base font-semibold text-[#12263F]">
                    Validation Preview ({previewRows.length} rows)
                  </h3>
                  <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 tabular-nums">
                    {validCount} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="rounded-md bg-[#F28C38]/15 border border-[#F28C38]/35 px-2.5 py-0.5 text-xs font-semibold text-[#B85A0E] tabular-nums">
                      {invalidCount} Errors
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-[#12263F] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importValidOnly}
                      onChange={(e) => setImportValidOnly(e.target.checked)}
                      className="rounded border-[#DCE6F2] text-[#1D5FAF]"
                    />
                    Import valid rows only
                  </label>
                  <button
                    type="button"
                    disabled={importing || (validCount === 0 && importValidOnly)}
                    onClick={handleRunImport}
                    className="rounded-lg bg-[#1D5FAF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#174D8F] disabled:opacity-50"
                  >
                    {importing ? 'Importing...' : 'Run Import'}
                  </button>
                </div>
              </div>

              {progress > 0 && (
                <div className="px-5 py-2.5 bg-[#F6F9FD] border-b border-[#DCE6F2]">
                  <div className="flex items-center justify-between text-xs font-medium text-[#12263F] mb-1">
                    <span>Import Progress</span>
                    <span className="tabular-nums">{progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#DCE6F2] overflow-hidden">
                    <div
                      className="h-full bg-[#1D5FAF] transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#DCE6F2] bg-[#F6F9FD] font-semibold text-[#5B6B82]">
                      <th className="px-4 py-3">Row</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Category Path</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-right">Stock</th>
                      <th className="px-4 py-3">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE6F2]">
                    {previewRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={row.valid ? 'hover:bg-[#F6F9FD]' : 'bg-red-50/50'}
                      >
                        <td className="px-4 py-3 font-mono text-[#5B6B82]">#{row.rowNumber}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-[#12263F]">
                          {row.sku || <span className="text-red-600 italic">Missing</span>}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#12263F]">
                          {row.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-[#5B6B82]">{row.categoryPath || '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatINR(row.price)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.stock}</td>
                        <td className="px-4 py-3">
                          {row.valid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Ready
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {row.errors.map((err, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  {err.message}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Summary */}
          {result && (
            <div className="rounded-xl border border-[#DCE6F2] bg-white p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#12263F]">
                    Import Result Summary
                  </h3>
                  <p className="text-xs text-[#5B6B82]">
                    Job {result.jobId} · Completed {formatDateTime(result.completedAt)}
                  </p>
                </div>
                {result.failedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => downloadErrorReport(result.failedRows)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Error Report ({result.failedCount} rows)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tabular-nums">
                <div className="rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] p-3.5">
                  <p className="text-xs text-[#5B6B82]">Created</p>
                  <p className="mt-1 text-xl font-bold text-emerald-600">{result.createdCount}</p>
                </div>
                <div className="rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] p-3.5">
                  <p className="text-xs text-[#5B6B82]">Updated</p>
                  <p className="mt-1 text-xl font-bold text-[#1D5FAF]">{result.updatedCount}</p>
                </div>
                <div className="rounded-lg border border-[#DCE6F2] bg-[#F6F9FD] p-3.5">
                  <p className="text-xs text-[#5B6B82]">Failed</p>
                  <p className="mt-1 text-xl font-bold text-[#B85A0E]">{result.failedCount}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import History */}
      <div className="rounded-xl border border-[#DCE6F2] bg-white overflow-hidden">
        <div className="border-b border-[#DCE6F2] px-5 py-4">
          <h3 className="text-base font-semibold text-[#12263F]">Import History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#DCE6F2] bg-[#F6F9FD] text-xs font-semibold text-[#5B6B82]">
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Operation</th>
                <th className="px-4 py-3">Uploaded By</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Created / Updated</th>
                <th className="px-4 py-3 text-right">Failed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE6F2] text-xs">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-[#F6F9FD]">
                  <td className="px-4 py-3 font-mono font-medium text-[#12263F]">
                    {item.fileName}
                  </td>
                  <td className="px-4 py-3 text-[#5B6B82]">
                    {item.type === 'import_products' ? 'Product Import' : 'Price & Stock Update'}
                  </td>
                  <td className="px-4 py-3 text-[#12263F]">{item.uploadedBy}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{item.totalRows}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-emerald-700">
                    {item.createdCount} / {item.updatedCount}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#B85A0E]">
                    {item.failedCount}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-[#5B6B82] tabular-nums">
                    {formatDateTime(item.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
