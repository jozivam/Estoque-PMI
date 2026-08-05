import React from 'react';
import { Menu, RefreshCw, AlertTriangle, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';

interface HeaderProps {
  products: Product[];
  onOpenSheetsModal: () => void;
  onOpenAlertsTab: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  products,
  onOpenSheetsModal,
  onOpenAlertsTab
}) => {
  const activeProducts = products.filter(p => p.status === 'Ativo');
  const criticalItems = activeProducts.filter(p => p.quantidade <= p.quantidadeMinima);

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

        {/* Right side AppSheet actions (Sync status & Alerts) */}
        <div className="flex items-center space-x-2">
          {/* Sync Status Badge (AppSheet classic feature) */}
          <button
            id="btn-sync-sheets-header"
            onClick={onOpenSheetsModal}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition border border-white/20 active:scale-95"
            title="Sincronizar com Google Sheets"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-100 animate-spin-slow" />
            <span className="hidden xs:inline font-semibold">Sincronizado</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 ml-0.5" />
          </button>

          {/* Critical alerts badge button */}
          <button
            id="btn-alerts-indicator-header"
            onClick={onOpenAlertsTab}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${
              criticalItems.length > 0
                ? 'bg-amber-400 text-gray-900 shadow font-bold'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title="Ver itens críticos"
          >
            <AlertTriangle className={`w-4 h-4 ${criticalItems.length > 0 ? 'text-gray-900' : 'text-amber-300'}`} />
            <span>{criticalItems.length}</span>
            <span className="hidden sm:inline">crítico{criticalItems.length !== 1 ? 's' : ''}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

