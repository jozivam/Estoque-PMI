import React from 'react';
import { Menu, RefreshCw, AlertTriangle, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';

interface HeaderProps {
  syncQueueCount?: number;
  onOpenSheetsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  syncQueueCount = 0,
  onOpenSheetsModal
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#1a73e8] text-white shadow-md border-b border-[#1557b0]">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex items-center justify-between">
        {/* Left AppSheet Brand & Menu Icon */}
        <div className="flex items-center space-x-3">
          <button
            id="btn-appsheet-menu"
            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition focus:outline-none"
            title="Menu AppSheet"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                  Estoque PMI
                </h1>
                <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                  AppSheet
                </span>
              </div>
              <p className="text-[11px] text-blue-100 hidden sm:block">
                Almoxarifado & Controle de Material
              </p>
            </div>
          </div>
        </div>

        {/* Right side AppSheet actions (Sync status) */}
        <div className="flex items-center space-x-2">
          {/* Sync Status Badge (AppSheet classic feature) */}
          <button
            id="btn-sync-sheets-header"
            onClick={onOpenSheetsModal}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition border active:scale-95 ${
              syncQueueCount > 0
                ? 'bg-amber-400 text-gray-900 border-amber-500 shadow'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
            title="Sincronizar com Google Sheets"
          >
            {syncQueueCount > 0 ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-gray-900 animate-spin" />
                <span className="hidden xs:inline font-bold">{syncQueueCount} Pendente{syncQueueCount !== 1 ? 's' : ''}</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-100" />
                <span className="hidden xs:inline font-semibold">Sincronizado</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 ml-0.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

