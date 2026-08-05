import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, Upload, Check, RefreshCw, Database } from 'lucide-react';
import { Product, Movement, GoogleSheetsConfig } from '../types';
import { productsToCSV, movementsToCSV, downloadFile } from '../utils/googleSheets';

interface GoogleSheetsModalProps {
  products: Product[];
  movements: Movement[];
  sheetsConfig: GoogleSheetsConfig;
  onUpdateConfig: (config: GoogleSheetsConfig) => void;
  onResetData: () => void;
  onImportData: (importedProducts: Product[]) => void;
  onClose: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  products,
  movements,
  sheetsConfig,
  onUpdateConfig,
  onResetData,
  onImportData,
  onClose
}) => {
  const [sheetId, setSheetId] = useState<string>(sheetsConfig.sheetId || '');
  const [autoSync, setAutoSync] = useState<boolean>(sheetsConfig.autoSync || false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const handleSaveConfig = () => {
    const newConfig: GoogleSheetsConfig = {
      sheetId: sheetId.trim(),
      autoSync,
      lastSynced: new Date().toISOString()
    };
    onUpdateConfig(newConfig);
    setSyncStatus('Configuração salva com sucesso!');
    setTimeout(() => setSyncStatus(''), 3000);
  };

  const handleExportPagina1 = () => {
    const csv = productsToCSV(products);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(csv, `Pagina1_ESTOQUE_PMI_${dateStr}.csv`);
  };

  const handleExportMovimentacoes = () => {
    const csv = movementsToCSV(movements);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(csv, `MOVIMENTACOES_ESTOQUE_PMI_${dateStr}.csv`);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportData(parsed);
          setSyncStatus(`Sucesso! ${parsed.length} itens importados.`);
        }
      } catch (err) {
        alert('Erro ao ler arquivo JSON. Verifique a estrutura.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-gray-300 rounded-lg w-full max-w-lg overflow-hidden shadow-2xl my-6 flex flex-col">
        {/* AppSheet Header Bar */}
        <div className="bg-[#1a73e8] px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-white/90" />
            <h2 className="text-sm font-bold uppercase tracking-wide">
              Conexão Google Sheets & Planilha
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto bg-gray-50">
          {syncStatus && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-3 py-2 rounded font-semibold flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{syncStatus}</span>
            </div>
          )}

          {/* Quick Export / Download Section */}
          <div className="bg-white p-3 rounded-md border border-gray-200 space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-600 flex items-center space-x-1">
              <Download className="w-3.5 h-3.5 text-[#1a73e8]" />
              <span>1. Exportar para Planilha (Formatos CSV)</span>
            </h3>
            <p className="text-xs text-gray-500">
              Baixe as abas de produtos e histórico para sincronizar com Google Sheets:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleExportPagina1}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Aba 'Pagina1' (Itens)</span>
              </button>

              <button
                onClick={handleExportMovimentacoes}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs border border-gray-300 transition"
              >
                <Download className="w-3.5 h-3.5 text-[#1a73e8]" />
                <span>Aba 'MOVIMENTACOES'</span>
              </button>
            </div>
          </div>

          {/* Google Sheet ID Input & Sync Options */}
          <div className="bg-white p-3 rounded-md border border-gray-200 space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-600 flex items-center space-x-1">
              <RefreshCw className="w-3.5 h-3.5 text-[#1a73e8]" />
              <span>2. ID da Planilha do Google Sheets</span>
            </h3>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                ID DA PLANILHA (OU URL)
              </label>
              <input
                type="text"
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
                placeholder="Ex: 1BxiMVs0XRnt3kg_Ih0yRfhH8aM..."
                className="w-full bg-gray-50 text-gray-900 font-mono text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#1a73e8] focus:bg-white focus:outline-none"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Localizado na URL da sua planilha: docs.google.com/spreadsheets/d/<b>[SEU_ID_AQUI]</b>/edit
              </span>
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded border border-gray-200">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-gray-800 block">Sincronização em Tempo Real</span>
                <span className="text-[10px] text-gray-500 block">Sincronizar alterações com a nuvem</span>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 accent-[#1a73e8] rounded cursor-pointer"
              />
            </div>

            <button
              onClick={handleSaveConfig}
              className="w-full py-2 rounded bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs transition shadow"
            >
              Salvar Configuração de Sincronização
            </button>
          </div>

          {/* Backup & Import */}
          <div className="bg-white p-3 rounded-md border border-gray-200 space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-600 flex items-center space-x-1">
              <Database className="w-3.5 h-3.5 text-gray-500" />
              <span>3. Backup e Restauração</span>
            </h3>

            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 text-xs font-bold cursor-pointer transition">
                <Upload className="w-3.5 h-3.5 text-[#1a73e8]" />
                <span>Importar JSON</span>
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>

              <button
                onClick={onResetData}
                className="flex-1 py-2 px-3 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition"
              >
                Restaurar Dados Iniciais
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

