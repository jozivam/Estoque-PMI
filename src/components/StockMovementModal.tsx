import React, { useState } from 'react';
import { X, Plus, Minus, User, FileText, Check, AlertCircle } from 'lucide-react';
import { Product, MovementType } from '../types';

interface StockMovementModalProps {
  product: Product;
  defaultType: MovementType;
  onConfirm: (
    productId: string,
    tipo: MovementType,
    quantidade: number,
    responsavel: string,
    observacao?: string,
    notaFiscal?: string
  ) => void;
  onClose: () => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  product,
  defaultType,
  onConfirm,
  onClose
}) => {
  const [tipo, setTipo] = useState<MovementType>(defaultType);
  const [quantidade, setQuantidade] = useState<number>(1);
  const [responsavel, setResponsavel] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');
  const [notaFiscal, setNotaFiscal] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const isEntry = tipo === 'Entrada';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (quantidade <= 0) {
      setErrorMsg('A quantidade deve ser maior que zero.');
      return;
    }

    if (!isEntry && quantidade > product.quantidade) {
      setErrorMsg(`Quantidade insuficiente em estoque! Disponível: ${product.quantidade}`);
      return;
    }

    if (!responsavel.trim()) {
      setErrorMsg('Por favor, informe o nome do responsável pela movimentação.');
      return;
    }

    onConfirm(product.id, tipo, quantidade, responsavel.trim(), observacao.trim(), notaFiscal.trim());
  };

  const setQuickAmount = (amount: number) => {
    setQuantidade(Math.max(1, amount));
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-gray-300 rounded-lg w-full max-w-md overflow-hidden shadow-2xl my-6 flex flex-col">
        {/* AppSheet Header */}
        <div className={`px-4 py-3 text-white flex items-center justify-between ${
          isEntry ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-white/20 text-white flex items-center justify-center font-bold">
              {isEntry ? <Plus className="w-4 h-4 stroke-[3]" /> : <Minus className="w-4 h-4 stroke-[3]" />}
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Registrar {tipo}
              </h3>
              <p className="text-[11px] text-white/80 font-mono">
                {product.id} - {product.nome}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 bg-gray-50">
          {errorMsg && (
            <div className="bg-red-50 border border-red-300 text-red-800 text-xs px-3 py-2 rounded font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Stock Card */}
          <div className="bg-white p-3 rounded border border-gray-200 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">Estoque Atual em Almoxarifado:</span>
            <span className="text-sm font-black text-gray-900">{product.quantidade} un.</span>
          </div>

          {/* Type Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded border border-gray-200">
            <button
              type="button"
              onClick={() => { setTipo('Entrada'); setErrorMsg(''); }}
              className={`py-1.5 text-xs font-bold rounded transition ${
                isEntry
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              + Entrada (Adicionar)
            </button>
            <button
              type="button"
              onClick={() => { setTipo('Saída'); setErrorMsg(''); }}
              className={`py-1.5 text-xs font-bold rounded transition ${
                !isEntry
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              - Saída (Retirada)
            </button>
          </div>

          {/* Quantity Input with Presets */}
          <div className="bg-white p-3 rounded border border-gray-200 space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">
              QUANTIDADE *
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
                className="w-full text-center text-xl font-black bg-gray-50 text-gray-900 border border-gray-300 rounded py-1.5 focus:border-[#1a73e8] focus:bg-white focus:outline-none"
              />
            </div>
            
            {/* Quick Presets */}
            <div className="grid grid-cols-5 gap-1">
              {[1, 2, 5, 10, 50].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQuickAmount(val)}
                  className={`py-1 rounded text-xs font-bold transition ${
                    quantidade === val
                      ? 'bg-[#1a73e8] text-white'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Responsible Input */}
          <div className="bg-white p-3 rounded border border-gray-200">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              RESPONSÁVEL PELA OPERAÇÃO *
            </label>
            <input
              type="text"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              placeholder="Ex: Carlos Almoxarife"
              className="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:border-[#1a73e8] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Note / Invoice Input */}
          {isEntry ? (
            <div className="bg-white p-3 rounded border border-gray-200">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                NOTA FISCAL / FORNECEDOR (OPCIONAL)
              </label>
              <input
                type="text"
                value={notaFiscal}
                onChange={(e) => setNotaFiscal(e.target.value)}
                placeholder="Ex: NF-89123"
                className="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:border-[#1a73e8] focus:bg-white focus:outline-none"
              />
            </div>
          ) : (
            <div className="bg-white p-3 rounded border border-gray-200">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                FINALIDADE / OBRA (OPCIONAL)
              </label>
              <input
                type="text"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: Obra Subestação Bloco B"
                className="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:border-[#1a73e8] focus:bg-white focus:outline-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex items-center space-x-1 px-4 py-2 rounded text-white text-xs font-bold transition shadow ${
                isEntry
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirmar {tipo}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

