import React, { useState, useMemo } from 'react';
import { ArrowRightLeft, Search, Download, Filter, User, Calendar, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Movement } from '../types';
import { movementsToCSV, downloadFile } from '../utils/googleSheets';

interface MovementHistoryProps {
  movements: Movement[];
}

export const MovementHistory: React.FC<MovementHistoryProps> = ({ movements }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'TODOS' | 'Entrada' | 'Saída'>('TODOS');

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (filterType !== 'TODOS' && m.tipo !== filterType) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          m.produtoNome.toLowerCase().includes(term) ||
          m.produtoId.toLowerCase().includes(term) ||
          m.responsavel.toLowerCase().includes(term) ||
          (m.observacao || '').toLowerCase().includes(term) ||
          (m.notaFiscal || '').toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [movements, searchTerm, filterType]);

  const handleExportCSV = () => {
    const csv = movementsToCSV(movements);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(csv, `MOVIMENTACOES_ESTOQUE_PMI_${dateStr}.csv`);
  };

  return (
    <div className="space-y-3">
      {/* Header Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
              <ArrowRightLeft className="w-4 h-4 text-[#1a73e8]" />
              <span>Histórico de Movimentações</span>
            </h2>
            <p className="text-xs text-gray-500">
              Registros de entradas e saídas de material no almoxarifado.
            </p>
          </div>

          <button
            id="btn-export-movements-csv"
            onClick={handleExportCSV}
            className="flex items-center justify-center space-x-1 px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 text-xs font-bold transition shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>
        </div>

        {/* Search & Filter Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-100">
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por produto, responsável ou nota..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 text-gray-900 rounded border border-gray-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none text-xs"
            />
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setFilterType('TODOS')}
              className={`flex-1 py-1.5 rounded text-xs font-bold transition ${
                filterType === 'TODOS'
                  ? 'bg-[#1a73e8] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('Entrada')}
              className={`flex-1 py-1.5 rounded text-xs font-bold transition ${
                filterType === 'Entrada'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setFilterType('Saída')}
              className={`flex-1 py-1.5 rounded text-xs font-bold transition ${
                filterType === 'Saída'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Saídas
            </button>
          </div>
        </div>
      </div>

      {/* Movements Timeline List */}
      <div className="space-y-2">
        {filteredMovements.length > 0 ? (
          filteredMovements.map(mov => {
            const isEntry = mov.tipo === 'Entrada';
            const dateFormatted = new Date(mov.data).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={mov.id}
                className="bg-white border border-gray-200 rounded-lg p-3 shadow-2xs hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 font-bold ${
                    isEntry ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {isEntry ? <ArrowDownRight className="w-4 h-4 stroke-[2.5]" /> : <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        isEntry ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {mov.tipo.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#1a73e8]">{mov.produtoId}</span>
                    </div>

                    <h4 className="text-xs font-bold text-gray-900">
                      {mov.produtoNome}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500 mt-1">
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span>{mov.responsavel}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{dateFormatted}</span>
                      </span>
                    </div>

                    {(mov.observacao || mov.notaFiscal) && (
                      <div className="mt-1 text-[11px] text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 inline-block">
                        {mov.notaFiscal && <span className="font-bold text-[#1a73e8] mr-1.5">NF: {mov.notaFiscal}</span>}
                        <span>{mov.observacao}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-gray-100 pt-1 sm:pt-0 shrink-0">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">Quantidade</span>
                  <span className={`text-base font-black ${isEntry ? 'text-emerald-700' : 'text-red-700'}`}>
                    {isEntry ? '+' : '-'}{mov.quantidade} un.
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500 text-xs">
            Nenhuma movimentação encontrada.
          </div>
        )}
      </div>
    </div>
  );
};

