import React from 'react';
import { Package, Hash, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { Product, Movement } from '../types';

interface MetricsCardsProps {
  products: Product[];
  movements: Movement[];
  onFilterLowStock: () => void;
  onViewMovements: () => void;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  products,
  movements,
  onFilterLowStock,
  onViewMovements
}) => {
  const activeProducts = products.filter(p => p.status === 'Ativo');
  const totalItems = activeProducts.length;
  const totalUnits = activeProducts.reduce((acc, p) => acc + (p.quantidade || 0), 0);
  const criticalProducts = activeProducts.filter(p => p.quantidade <= p.quantidadeMinima);
  const totalMovementsToday = movements.filter(m => {
    const today = new Date().toISOString().split('T')[0];
    return m.data.startsWith(today);
  }).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      {/* Total Distinct Products */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-2xs">
        <div className="flex items-center justify-between text-gray-500 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total de Itens</span>
          <div className="p-1 rounded-md bg-blue-50 text-[#1a73e8]">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-xl sm:text-2xl font-black text-gray-900">{totalItems}</span>
          <span className="text-xs text-gray-500">cadastrados</span>
        </div>
      </div>

      {/* Total Units in Stock */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-2xs">
        <div className="flex items-center justify-between text-gray-500 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Unidades</span>
          <div className="p-1 rounded-md bg-emerald-50 text-emerald-600">
            <Hash className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-xl sm:text-2xl font-black text-gray-900">{totalUnits}</span>
          <span className="text-xs text-gray-500">em estoque</span>
        </div>
      </div>

      {/* Critical Stock Alert */}
      <button
        id="card-critical-alert"
        onClick={onFilterLowStock}
        className={`text-left border rounded-lg p-3 shadow-2xs transition active:scale-[0.98] ${
          criticalProducts.length > 0
            ? 'bg-amber-50/80 border-amber-300 hover:border-amber-400'
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Estoque Baixo</span>
          <div className={`p-1 rounded-md ${criticalProducts.length > 0 ? 'bg-amber-200 text-amber-900' : 'bg-gray-100 text-gray-500'}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-1">
          <span className={`text-xl sm:text-2xl font-black ${criticalProducts.length > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
            {criticalProducts.length}
          </span>
          <span className="text-xs text-gray-500">crítico{criticalProducts.length !== 1 ? 's' : ''}</span>
        </div>
      </button>

      {/* Today Movements */}
      <button
        id="card-movements-today"
        onClick={onViewMovements}
        className="text-left bg-white border border-gray-200 hover:border-gray-300 rounded-lg p-3 shadow-2xs transition active:scale-[0.98]"
      >
        <div className="flex items-center justify-between text-gray-500 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Movimentações</span>
          <div className="p-1 rounded-md bg-indigo-50 text-indigo-600">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-xl sm:text-2xl font-black text-gray-900">{totalMovementsToday}</span>
          <span className="text-xs text-gray-500">hoje</span>
        </div>
      </button>
    </div>
  );
};

