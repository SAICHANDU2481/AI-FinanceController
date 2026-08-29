import React, { useState } from 'react';
import { transactionAPI } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';
import { useNotifications } from '../../context/NotificationContext';
import { UploadCloud, Sparkles, FileText, CheckCircle2, X, AlertCircle } from 'lucide-react';

export const ReceiptScannerModal = ({ isOpen, onClose, onSuccess }) => {
  const { formatCurrency, symbol } = useCurrency();
  const { showToast } = useNotifications();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
      runScan(droppedFile);
    }
  };

  const runScan = async (selectedFile) => {
    setScanning(true);
    setParsedData(null);

    const formData = new FormData();
    formData.append('receipt', selectedFile);
    formData.append('textHint', selectedFile.name);

    try {
      // Small simulated scanning delay for visual wow factor
      await new Promise(r => setTimeout(r, 900));
      const res = await transactionAPI.uploadReceipt(formData);
      setParsedData(res.data.parsedData);
      showToast('Receipt parsed by AI multi-modal OCR', 'success');
    } catch (err) {
      showToast('Failed to parse receipt', 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;
    setSaving(true);
    try {
      await transactionAPI.create({
        amount: parsedData.amount,
        type: 'EXPENSE',
        category: parsedData.category,
        subCategory: parsedData.subCategory,
        description: `${parsedData.merchant} Receipt`,
        merchant: parsedData.merchant,
        paymentMethod: parsedData.paymentMethod || 'UPI',
        date: parsedData.date || new Date().toISOString()
      });

      showToast('Receipt logged to transaction ledger', 'success', 'Import Successful');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showToast('Failed to save imported transaction', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Smart Receipt & Bill Scanner</h3>
              <p className="text-[11px] text-slate-400">Multi-modal AI vision item extraction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!file ? (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl p-8 text-center transition-colors cursor-pointer bg-slate-950/40"
              onClick={() => document.getElementById('receiptFileInput').click()}
            >
              <input
                type="file"
                id="receiptFileInput"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileDrop}
              />
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">
                Drop invoice or receipt here, or browse
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Supports PNG, JPEG, PDF bills from D-Mart, Amazon, restaurants, utilities
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs text-slate-300 truncate">
                  <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setParsedData(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Change File
                </button>
              </div>

              {/* Scanning state */}
              {scanning && (
                <div className="p-8 text-center rounded-2xl bg-slate-950/60 border border-cyan-500/30">
                  <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <h4 className="text-sm font-semibold text-white">AI Vision Scanning Receipt...</h4>
                  <p className="text-xs text-slate-400 mt-1">Extracting line items, merchant metadata, and totals</p>
                </div>
              )}

              {/* Parsed Result Display */}
              {parsedData && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-cyan-400">Detected Merchant</span>
                      <h4 className="text-base font-bold text-white">{parsedData.merchant}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Outflow</span>
                      <div className="text-lg font-mono font-extrabold text-emerald-400">
                        {formatCurrency(parsedData.amount)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-900">
                      <span className="text-slate-400 text-[10px] block">Category</span>
                      <span className="font-semibold text-slate-200">{parsedData.category} ({parsedData.subCategory})</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900">
                      <span className="text-slate-400 text-[10px] block">Payment Method</span>
                      <span className="font-semibold text-slate-200">{parsedData.paymentMethod}</span>
                    </div>
                  </div>

                  {/* Line Items */}
                  {parsedData.items && parsedData.items.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                        Extracted Line Items:
                      </span>
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {parsedData.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-900/50">
                            <span className="text-slate-300">{item.name}</span>
                            <span className="font-mono text-slate-400">{formatCurrency(item.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 pt-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Confidence: {Math.round(parsedData.confidence * 100)}% verified with pattern matching</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
          {parsedData && (
            <button
              onClick={handleImport}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Importing...' : 'Add to Ledger'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
