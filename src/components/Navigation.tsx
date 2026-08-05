import React from 'react';
import { Package, ArrowRightLeft, PlusCircle, AlertTriangle, Settings } from 'lucide-react';
import { ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  criticalCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  criticalCount
}) => {
  const tabs = [
    {
      id: 'estoque' as ActiveTab,
      label: 'Estoque',
      icon: Package,
    },
    {
      id: 'movimentacoes' as ActiveTab,
      label: 'Histórico',
      icon: ArrowRightLeft,
    },
    {
      id: 'cadastrar' as ActiveTab,
      label: '+ Cadastrar',
      icon: PlusCircle,
      isPrimary: true
    },
    {
      id: 'alertas' as ActiveTab,
      label: 'Críticos',
      icon: AlertTriangle,
      badge: criticalCount > 0 ? criticalCount : undefined
    },
    {
      id: 'configuracoes' as ActiveTab,
      label: 'Planilha',
      icon: Settings,
    }
  ];

  return (
    <>
      {/* Desktop Top Sub-Bar (AppSheet View Tabs) */}
      <nav className="hidden md:block bg-white border-b border-gray-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-desktop-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                  isActive
                    ? 'border-[#1a73e8] text-[#1a73e8] bg-blue-50/60'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Fixed Bottom AppSheet Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1 items-center">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            if (tab.isPrimary) {
              return (
                <div key={tab.id} className="flex justify-center -mt-5">
                  <button
                    id={`tab-mobile-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-13 h-13 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold flex flex-col items-center justify-center shadow-lg active:scale-95 transition border-2 border-white"
                    title="Cadastrar Novo Item"
                  >
                    <PlusCircle className="w-7 h-7 stroke-[2.2]" />
                  </button>
                </div>
              );
            }

            return (
              <button
                key={tab.id}
                id={`tab-mobile-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 transition relative ${
                  isActive ? 'text-[#1a73e8] font-bold' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 mb-0.5" />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1 py-0.2 rounded-full min-w-4 text-center">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] leading-tight tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

