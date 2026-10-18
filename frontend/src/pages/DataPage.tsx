import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Table, 
  Database,
  ArrowRight,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { DatasetValidation, ColumnMappingPreviewResult } from '../types';

interface DataPageProps {
  onRefreshAll: () => void;
}

const SCHEMA_FIELDS_BY_DATASET: Record<string, { required: string[]; optional: string[] }> = {
  new_sku_attributes: {
    required: ['sku_id', 'category', 'retail_price', 'cost_price'],
    optional: ['subcategory', 'color', 'material', 'brand_tier', 'launch_month', 'marketing_spend_flag']
  },
  historical_attributes: {
    required: ['sku_id', 'category', 'retail_price', 'cost_price'],
    optional: ['subcategory', 'color', 'material', 'brand_tier', 'launch_month', 'marketing_spend_flag']
  },
  historical_launch_curves: {
    required: ['sku_id', 'launch_week', 'sales_units'],
    optional: []
  },
  three_year_weekly_sales: {
    required: ['sku_id', 'week_start', 'sales_units'],
    optional: []
  },
  store_clusters: {
    required: ['cluster_id', 'cluster_name', 'store_count', 'base_capacity_weight'],
    optional: []
  },
  holiday_calendar: {
    required: ['date', 'event_name', 'demand_lift_factor'],
    optional: []
  },
  hidden_actual_sales: {
    required: ['sku_id', 'launch_week', 'sales_units'],
    optional: []
  }
};

export const DataPage: React.FC<DataPageProps> = ({ onRefreshAll }) => {
  const [selectedTable, setSelectedTable] = useState<string>('new_sku_attributes');
  const [validation, setValidation] = useState<DatasetValidation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Column mapping modal state
  const [previewData, setPreviewData] = useState<ColumnMappingPreviewResult | null>(null);
  const [targetToCsvMap, setTargetToCsvMap] = useState<Record<string, string>>({});
  const [isApplyingMapping, setIsApplyingMapping] = useState<boolean>(false);
  const [mappingError, setMappingError] = useState<string | null>(null);

  const tables = [
    { id: 'new_sku_attributes', name: 'New SKU Attributes (Cold-Start)', count: '150 items' },
    { id: 'historical_attributes', name: 'Historical Product Attributes', count: '1,200 items' },
    { id: 'historical_launch_curves', name: 'Historical Launch Curves (W1-W8)', count: '9,600 rows' },
    { id: 'three_year_weekly_sales', name: '3-Year Weekly Sales', count: '156 weeks' },
    { id: 'store_clusters', name: 'Store Clusters & Affinity', count: '5 clusters' },
    { id: 'holiday_calendar', name: 'Holiday & Promotional Calendar', count: '36 events' },
    { id: 'hidden_actual_sales', name: 'Hidden Actuals (Benchmark Validation)', count: '150 items' },
  ];

  const fetchValidation = async (tableId: string) => {
    setIsLoading(true);
    try {
      const data = await apiClient.validateDataset(tableId);
      setValidation(data);
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchValidation(selectedTable);
  }, [selectedTable]);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a valid CSV file.');
      return;
    }
    setIsUploading(true);
    setUploadMessage(null);
    setMappingError(null);
    try {
      const preview = await apiClient.previewColumnMapping(file, selectedTable);
      setPreviewData(preview);

      const initialTargetMap: Record<string, string> = {};
      const schemaDef = SCHEMA_FIELDS_BY_DATASET[selectedTable] || SCHEMA_FIELDS_BY_DATASET['new_sku_attributes'];
      const allSchemaFields = [...schemaDef.required, ...schemaDef.optional];

      allSchemaFields.forEach((targetField) => {
        if (preview.suggested_mapping && preview.suggested_mapping[targetField]) {
          initialTargetMap[targetField] = preview.suggested_mapping[targetField];
        } else if (preview.columns.includes(targetField)) {
          initialTargetMap[targetField] = targetField;
        } else {
          initialTargetMap[targetField] = '__none__';
        }
      });

      setTargetToCsvMap(initialTargetMap);
    } catch (err: any) {
      alert(`Upload or schema preview failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyMapping = async () => {
    if (!previewData) return;

    const schemaDef = SCHEMA_FIELDS_BY_DATASET[selectedTable] || SCHEMA_FIELDS_BY_DATASET['new_sku_attributes'];
    const missingRequired = schemaDef.required.filter(
      (reqField) => !targetToCsvMap[reqField] || targetToCsvMap[reqField] === '__none__'
    );

    if (missingRequired.length > 0) {
      setMappingError(`Missing required column mappings for: ${missingRequired.join(', ')}`);
      return;
    }

    setIsApplyingMapping(true);
    setMappingError(null);

    const columnMappingForBackend: Record<string, string> = {};
    Object.entries(targetToCsvMap).forEach(([targetField, csvCol]) => {
      if (csvCol && csvCol !== '__none__') {
        columnMappingForBackend[csvCol] = targetField;
      }
    });

    try {
      const res = await apiClient.applyColumnMapping({
        tempFilename: previewData.temp_filename,
        datasetType: previewData.dataset_type,
        columnMapping: columnMappingForBackend
      });

      setValidation(res.validation);
      setUploadMessage(`Successfully applied mapping & loaded ${res.rows} rows into ${selectedTable}!`);
      setPreviewData(null);
      onRefreshAll();
    } catch (err: any) {
      setMappingError(err.message || 'Failed to apply column mapping.');
    } finally {
      setIsApplyingMapping(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const downloadAuditReport = () => {
    if (!validation) return;
    const lines = [
      'LaunchWise AI - Data Quality Audit Report',
      `Dataset: ${selectedTable}`,
      `Quality Score: ${validation.quality_score}%`,
      `Valid: ${validation.is_valid}`,
      `Total Rows: ${validation.row_count}`,
      `Total Columns: ${validation.column_count}`,
      `Duplicate Count: ${validation.duplicate_count}`,
      '',
      'Identified Errors:',
      ...(validation.errors.length > 0 ? validation.errors.map(e => `ERROR: ${e}`) : ['None']),
      '',
      'Identified Warnings:',
      ...(validation.warnings.length > 0 ? validation.warnings.map(w => `WARNING: ${w}`) : ['None']),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_quality_report_${selectedTable}.csv`;
    a.click();
  };

  const activeSchema = SCHEMA_FIELDS_BY_DATASET[selectedTable] || SCHEMA_FIELDS_BY_DATASET['new_sku_attributes'];

  return (
    <div className="p-8 space-y-6">
      {/* Top Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {tables.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTable(t.id)}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedTable === t.id
                ? 'bg-white border-brand-blue ring-2 ring-brand-blue/20 shadow-sm'
                : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="truncate">{t.name.split(' ')[0]} {t.name.split(' ')[1]}</span>
              <Database className={`w-3.5 h-3.5 ${selectedTable === t.id ? 'text-brand-blue' : 'text-slate-400'}`} />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">{t.name}</p>
            <p className="text-[10px] font-mono text-brand-teal font-semibold mt-1.5">{t.count}</p>
          </button>
        ))}
      </div>

      {/* Main Work Area: Drag-Drop & Validation Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Upload Dataset (CSV)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload custom CSV to replace or augment <strong className="text-slate-700">{selectedTable}</strong>
            </p>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragOver ? 'border-brand-blue bg-blue-50/50' : 'border-slate-200 hover:border-brand-blue/50'
              }`}
              onClick={() => document.getElementById('csv-file-input')?.click()}
            >
              <input
                type="file"
                id="csv-file-input"
                className="hidden"
                accept=".csv"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
              />
              <div className="w-10 h-10 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center mx-auto mb-2">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800">Click to browse or drop CSV here</p>
              <p className="text-[11px] text-slate-400 mt-1">UTF-8 CSV format, up to 50MB</p>
            </div>

            {isUploading && (
              <div className="mt-4 flex items-center gap-2 text-xs text-brand-blue">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Validating schema and uploading records...</span>
              </div>
            )}

            {uploadMessage && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadMessage}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => fetchValidation(selectedTable)}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-audit
            </button>
            <button
              onClick={downloadAuditReport}
              disabled={!validation}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Audit Report (.csv)
            </button>
          </div>
        </div>

        {/* Quality Scorecard & Column Mapping */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Data Quality Scorecard & Validation</h3>
              <p className="text-xs text-slate-500">Automated pre-flight checks before training forecasting pipelines</p>
            </div>
            {validation && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Quality Score:</span>
                <span className={`text-sm font-bold font-mono px-2.5 py-0.5 rounded-md border ${
                  validation.quality_score >= 85 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {validation.quality_score}%
                </span>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="h-44 bg-slate-100 rounded-lg animate-pulse"></div>
          ) : validation ? (
            <div className="space-y-4">
              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Row Count</span>
                  <span className="font-bold text-slate-800 font-mono">{validation.row_count.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Columns</span>
                  <span className="font-bold text-slate-800 font-mono">{validation.column_count}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Duplicate Rows</span>
                  <span className="font-bold text-slate-800 font-mono">{validation.duplicate_count}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Schema Status</span>
                  <span className={`font-bold ${validation.is_valid ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {validation.is_valid ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>

              {/* Validation Messages */}
              {validation.errors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Validation Errors:
                  </div>
                  {validation.errors.map((e, idx) => (
                    <p key={idx} className="text-rose-700 pl-5">• {e}</p>
                  ))}
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Advisories & Notes:
                  </div>
                  {validation.warnings.map((w, idx) => (
                    <p key={idx} className="text-amber-700 pl-5">• {w}</p>
                  ))}
                </div>
              )}

              {/* Column Mapping Preview */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Mapped Dataset Columns:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {validation.columns.map((col) => (
                    <span 
                      key={col} 
                      className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-mono"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Dataset Preview Table */}
      {validation && validation.preview && validation.preview.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold text-slate-800">Dataset Preview (First 10 Rows)</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Showing 10 of {validation.row_count.toLocaleString()} rows
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  {Object.keys(validation.preview[0]).map((col) => (
                    <th key={col} className="px-4 py-2.5 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {validation.preview.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {Object.values(row).map((val: any, cIdx) => (
                      <td key={cIdx} className="px-4 py-2 whitespace-nowrap font-mono text-[11px]">
                        {typeof val === 'number' ? val.toLocaleString() : String(val ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive Column Mapping Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-brand-blue" />
                  Map CSV Columns to LaunchWise Schema
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  File: <strong className="text-slate-800">{previewData.original_filename}</strong> ({previewData.columns.length} columns detected)
                </p>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Auto-matching disclosure banner */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-brand-blue">Intelligent Column Synonym Matcher Active</p>
                  <p className="text-slate-600 mt-0.5">
                    LaunchWise AI automatically matched synonym variations (e.g. <code>cogs</code> &rarr; <code>cost_price</code>, <code>price</code> &rarr; <code>retail_price</code>, <code>item_code</code> &rarr; <code>sku_id</code>). Verify or reassign any field below.
                  </p>
                </div>
              </div>

              {mappingError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{mappingError}</span>
                </div>
              )}

              {/* Column Mapping Selectors */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target Schema Field</span>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">CSV Header from Uploaded File</span>
                </div>

                {/* Required Fields */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                    Required Fields <span className="text-rose-500">*</span>
                  </div>
                  {activeSchema.required.map((reqField) => {
                    const currentVal = targetToCsvMap[reqField] || '__none__';
                    const isMatched = currentVal !== '__none__';

                    return (
                      <div key={reqField} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-slate-900">{reqField}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold">Required</span>
                        </div>
                        <select
                          value={currentVal}
                          onChange={(e) => setTargetToCsvMap(prev => ({ ...prev, [reqField]: e.target.value }))}
                          className={`text-xs rounded-lg px-3 py-1.5 border font-mono transition-colors ${
                            isMatched ? 'bg-white border-brand-blue/50 text-slate-800' : 'bg-rose-50 border-rose-300 text-rose-700'
                          }`}
                        >
                          <option value="__none__">-- Unmapped (Select CSV Column) --</option>
                          {previewData.columns.map((col) => (
                            <option key={col} value={col}>
                              {col}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                {/* Optional Fields (if any) */}
                {activeSchema.optional.length > 0 && (
                  <div className="space-y-2.5 pt-3">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Optional Attribute Fields
                    </div>
                    {activeSchema.optional.map((optField) => {
                      const currentVal = targetToCsvMap[optField] || '__none__';

                      return (
                        <div key={optField} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center p-2 rounded-lg bg-slate-50/60 border border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium font-mono text-slate-700">{optField}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">Optional</span>
                          </div>
                          <select
                            value={currentVal}
                            onChange={(e) => setTargetToCsvMap(prev => ({ ...prev, [optField]: e.target.value }))}
                            className="text-xs rounded-lg px-3 py-1.5 border border-slate-300 bg-white text-slate-700 font-mono"
                          >
                            <option value="__none__">-- Do not map (Use default) --</option>
                            {previewData.columns.map((col) => (
                              <option key={col} value={col}>
                                {col}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Uploaded File Quick Preview */}
              {previewData.preview && previewData.preview.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Original CSV Raw Sample (First 5 Rows):</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-[11px] text-slate-600">
                      <thead className="bg-slate-100 border-b border-slate-200 uppercase font-semibold text-[10px]">
                        <tr>
                          {previewData.columns.map((c) => (
                            <th key={c} className="px-3 py-1.5 whitespace-nowrap">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {previewData.preview.slice(0, 5).map((r, i) => (
                          <tr key={i}>
                            {previewData.columns.map((c) => (
                              <td key={c} className="px-3 py-1 whitespace-nowrap">{String(r[c] ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <button
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleApplyMapping}
                disabled={isApplyingMapping}
                className="px-5 py-2 bg-brand-blue hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {isApplyingMapping ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Applying Mapping & Re-forecasting...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Apply Mapping & Update Dataset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
