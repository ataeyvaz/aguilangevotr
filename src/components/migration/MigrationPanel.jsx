/**
 * AguiLang2 - Migration Panel
 * AguiLang1 JSON dosyalarını sürükle-bırak ile import eder
 * Yerleştirme: src/components/Migration/MigrationPanel.jsx
 */

import { useState, useRef, useCallback } from 'react';
import { useWordStore } from '../../store/useWordStore';

export default function MigrationPanel({ onClose }) {
  const [files,      setFiles]      = useState([]);
  const [status,     setStatus]     = useState('idle'); // idle | parsing | done | error
  const [result,     setResult]     = useState(null);
  const [dragOver,   setDragOver]   = useState(false);
  const fileInputRef = useRef(null);
  const { importAguiLang1Files, totalCount } = useWordStore();

  const processFiles = useCallback(async (fileList) => {
    setStatus('parsing');

    const loaded = [];
    for (const file of fileList) {
      if (!file.name.endsWith('.json')) continue;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        loaded.push({ name: file.name, data });
      } catch (e) {
        console.warn(`${file.name} okunamadı:`, e);
      }
    }

    if (loaded.length === 0) {
      setStatus('error');
      return;
    }

    setFiles(loaded.map(f => f.name));

    try {
      const stats = importAguiLang1Files(loaded);
      setResult(stats);
      setStatus('done');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  }, [importAguiLang1Files]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(Array.from(e.dataTransfer.files));
  }, [processFiles]);

  const handleFileInput = (e) => {
    processFiles(Array.from(e.target.files));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              📥 AguiLang1 Verisi İmport Et
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Mevcut: {totalCount} kelime
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100
                       dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* İçerik */}
        <div className="p-5 space-y-4">
          {/* Yol bilgisi */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-sm text-blue-700
                          dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <p className="font-semibold mb-1">📁 AguiLang1 dosya konumu:</p>
            <code className="text-xs bg-white dark:bg-blue-950 px-2 py-0.5 rounded block mt-1">
              C:\Users\Ata\Desktop\aguilang\docs\data-sources\processed\
            </code>
            <p className="mt-2 text-xs">
              Bu klasördeki tüm <strong>*.json</strong> dosyalarını seçin.
            </p>
          </div>

          {/* Drop zone */}
          {status === 'idle' && (
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
                          transition-all ${
                dragOver
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="text-4xl mb-3">📂</div>
              <p className="font-semibold text-gray-700 dark:text-gray-200">
                JSON dosyalarını sürükleyin
              </p>
              <p className="text-sm text-gray-400 mt-1">veya seçmek için tıklayın</p>
              <p className="text-xs text-gray-400 mt-3">
                Desteklenen: en-tr-a1.json, de-tr-b1.json, es-a2.json, ...
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".json"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          )}

          {/* Parsing */}
          {status === 'parsing' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent
                              rounded-full animate-spin" />
              <p className="text-gray-500">Veriler işleniyor...</p>
              {files.map(f => (
                <p key={f} className="text-xs text-gray-400">{f}</p>
              ))}
            </div>
          )}

          {/* Başarı */}
          {status === 'done' && result && (
            <div className="space-y-3">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200
                              dark:border-green-800 rounded-2xl p-4">
                <p className="text-green-700 dark:text-green-300 font-semibold text-lg">
                  ✅ {result.total} kelime başarıyla aktarıldı!
                </p>
              </div>

              {/* Dil dağılımı */}
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result.byLanguage).map(([lang, count]) => (
                  <div key={lang}
                       className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-indigo-600">{count}</p>
                    <p className="text-xs text-gray-500 uppercase">{lang}</p>
                  </div>
                ))}
                {Object.entries(result.byLevel).map(([level, count]) => (
                  <div key={level}
                       className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{count}</p>
                    <p className="text-xs text-gray-500">{level}</p>
                  </div>
                ))}
              </div>

              {result.duplicates > 0 && (
                <p className="text-xs text-gray-400 text-center">
                  {result.duplicates} tekrar kelime atlandı
                </p>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white
                           rounded-xl font-medium transition-colors"
              >
                Harika, başlayalım! 🚀
              </button>
            </div>
          )}

          {/* Hata */}
          {status === 'error' && (
            <div className="space-y-3">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200
                              dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400">
                ❌ JSON dosyaları okunamadı. Dosya formatını kontrol edin.
              </div>
              <button
                onClick={() => setStatus('idle')}
                className="w-full py-2 border border-gray-200 dark:border-gray-700
                           rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50
                           dark:hover:bg-gray-800 transition-colors"
              >
                Tekrar dene
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
