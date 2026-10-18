import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ArrowRight, 
  RefreshCw, 
  Sliders,
  Check,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { ColumnMappingPreviewResult, DatasetValidation } from '../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REQUIRED_FIELDS_BY_DATASET: Record<string, { label: string; required: string[]; optional: string[] }> = {
  new_sku_attributes: {
    label: 'New Cold-Start SKU Attributes',
    required: ['sku_id', 'category', 'retail_price', 'cost_price'],
    optional: ['product_name', 'subcategory', 'color', 'material', 'brand_tier', 'launch_month', 'marketing_spend_flag']
  },
  historical_attributes: {
    label: 'Historical Benchmark Attributes (1,200 SKUs)',
    required: ['sku_id', 'category', 'retail_price', 'cost_price'],
    optional: ['product_name', 'subcategory', 'color', 'material', 'brand_tier', 'launch_month', 'marketing_spend_flag']
  },
  historical_launch_curves: {
    label: 'Historical Launch Curves (Weeks 1-8)',
    required: ['sku_id', 'launch_week', 'sales_units'],
    optional: []
  },
  store_clusters: {
    label: 'Store Clusters & Allocation Affinity',
    required: ['cluster_id', 'cluster_name', 'store_count', 'base_capacity_weight'],
    optional: []
  }
};

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [datasetType, setDatasetType] = useState<string>('new_sku_attributes');
  const [file, setFile] = useState<File | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<ColumnMappingPreviewResult | null>(null);
  const [targetToCsvMap, setTargetToCsvMap] = useState<Record<string, string>>({});
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentDatasetConfig = REQUIRED_FIELDS_BY_DATASET[datasetType] || REQUIRED_FIELDS_BY_DATASET.new_sku_attributes;

  const handleFileSelected = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid CSV (.csv) file.');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setSuccessMsg(null);
    setIsLoadingPreview(true);

    try {
      const res = await apiClient.previewColumnMapping(selectedFile, datasetType);
      setPreviewData(res);

      // Initialize mapping dictionary: original_csv_col -> target_schema_field
      const initialMap: Record<string, string> = {};
      const allSchemaFields = [...currentDatasetConfig.required, ...currentDatasetConfig.optional];

      allSchemaFields.forEach((schemaField) => {
        // Look in suggested_mapping (which maps original_col -> target_field)
        let foundCol = '';
        for (const [origCol, targetField] of Object.entries(res.suggested_mapping || {})) {
          if (targetField === schemaField) {
            foundCol = origCol;
            break;
          }
        }
        if (!foundCol) {
          // Direct exact name match
          const exact = res.columns.find(c => c.toLowerCase().trim() === schemaField.toLowerCase());
          if (exact) foundCol = exact;
        }
        if (foundCol) {
          initialMap[schemaField] = foundCol;
        }
      });

      setTargetToCsvMap(initialMap);
    } catch (err: any) {
      setError(err.message || 'Failed to read and preview CSV file.');
      setFile(null);
      setPreviewData(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleApply = async () => {
    if (!previewData || !file) return;

    // Check that all required fields have a mapped column
    const missing = currentDatasetConfig.required.filter(req => !targetToCsvMap[req]);
    if (missing.length > 0) {
      setError(`Please map all mandatory columns: ${missing.join(', ')}`);
      return;
    }

    setIsApplying(true);
    setError(null);

    // Build the inverted map: original_col -> target_field
    const columnMapping: Record<string, string> = {};
    for (const [targetField, originalCol] of Object.entries(targetToCsvMap)) {
      if (originalCol) {
        columnMapping[originalCol] = targetField;
      }
    }

    try {
      const res = await apiClient.applyColumnMapping({
        tempFilename: previewData.temp_filename,
        datasetType: datasetType,
        columnMapping: columnMapping
      });

      setSuccessMsg(res.message || 'Dataset successfully validated and imported into LaunchWise AI!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to apply column mapping and import dataset.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setTargetToCsvMap({});
    setError(null);
    setSuccessMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              Import CSV Dataset & Column Mapping
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload any vendor or product CSV. The system auto-detects column synonyms and validates the schema.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Target Dataset Selector */}
        {!previewData && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Select Target Dataset Type:</label>
            <select
              value={datasetType}
              onChange={(e) => {
                setDatasetType(e.target.value);
                handleReset();
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="new_sku_attributes">New Cold-Start SKU Attributes (150 SKUs)</option>
              <option value="historical_attributes">Historical Product Attributes (1,200 mature SKUs)</option>
              <option value="historical_launch_curves">Historical Launch Curves (Weeks 1 to 8)</option>
              <option value="store_clusters">Store Cluster Definitions</option>
            </select>
          </div>
        )}

        {/* File Dropzone */}
        {!previewData ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelected(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragOver 
                ? 'border-indigo-500 bg-indigo-50/50' 
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
            />
            
            {isLoadingPreview ? (
              <div className="py-4 space-y-2">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Analyzing CSV structure and columns...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Click to browse or drag & drop CSV file
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports any column naming convention (e.g. SKU, MSRP, Price, Cost, Category)
                  </p>
                </div>
                <span className="inline-block text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-600">
                  Required: {currentDatasetConfig.required.join(', ')}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Column Mapping Interface */
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-900">{file?.name}</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  ({previewData.preview.length}+ rows &bull; {previewData.columns.length} columns)
                </span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-rose-600 hover:underline font-medium"
              >
                Choose Different File
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Schema Column Mapping</span>
                <span className="text-[10px] text-slate-400 font-normal">Auto-detected synonyms matched below</span>
              </div>

              <div className="p-4 space-y-3 max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                {/* Required Fields */}
                <div className="space-y-2 pb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700">
                    Mandatory Fields *
                  </span>
                  {currentDatasetConfig.required.map((targetField) => {
                    const currentMappedCol = targetToCsvMap[targetField] || '';
                    const isMapped = Boolean(currentMappedCol);
                    return (
                      <div key={targetField} className="flex items-center justify-between gap-3 pt-1">
                        <div className="flex items-center space-x-2 w-1/3">
                          <span className={`w-2 h-2 rounded-full ${isMapped ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="font-mono font-semibold text-slate-900">{targetField}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <select
                          value={currentMappedCol}
                          onChange={(e) => setTargetToCsvMap({ ...targetToCsvMap, [targetField]: e.target.value })}
                          className={`w-1/2 px-2.5 py-1.5 rounded-lg border text-xs font-medium focus:outline-none ${
                            isMapped 
                              ? 'bg-emerald-50/50 border-emerald-300 text-slate-800' 
                              : 'bg-rose-50/50 border-rose-300 text-rose-800'
                          }`}
                        >
                          <option value="">-- Select matching CSV column --</option>
                          {previewData.columns.map((col) => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                {/* Optional Fields */}
                {currentDatasetConfig.optional.length > 0 && (
                  <div className="space-y-2 pt-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Optional Fields
                    </span>
                    {currentDatasetConfig.optional.map((targetField) => {
                      const currentMappedCol = targetToCsvMap[targetField] || '';
                      return (
                        <div key={targetField} className="flex items-center justify-between gap-3 pt-1">
                          <div className="flex items-center space-x-2 w-1/3">
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                            <span className="font-mono text-slate-600">{targetField}</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <select
                            value={currentMappedCol}
                            onChange={(e) => setTargetToCsvMap({ ...targetToCsvMap, [targetField]: e.target.value })}
                            className="w-1/2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="">-- Not in CSV (Use Default) --</option>
                            {previewData.columns.map((col) => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Preview Table */}
            {previewData.preview && previewData.preview.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                  First 3 Rows Preview from {file?.name}
                </div>
                <div className="overflow-x-auto max-h-28 text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-mono text-[10px]">
                      <tr>
                        {previewData.columns.slice(0, 6).map((c) => (
                          <th key={c} className="px-3 py-1">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      {previewData.preview.slice(0, 3).map((row, idx) => (
                        <tr key={idx}>
                          {previewData.columns.slice(0, 6).map((c) => (
                            <td key={c} className="px-3 py-1 max-w-[120px] truncate">{String(row[c] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          
          {previewData && (
            <button
              type="button"
              disabled={isApplying}
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating & Loading...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Mapping & Ingest CSV</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
