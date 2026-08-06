import React, { useState } from 'react';
import { X, QrCode, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { Product, getProductPhotos } from '../types';

interface BarcodeScannerModalProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  products,
  onSelectProduct,
  onClose
}) => {
  const [code, setCode] = useState('');
  const [scannedItem, setScannedItem] = useState<Product | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleScanOrSearch = (inputCode: string) => {
    setCode(inputCode);
    setErrorMsg('');
    setScannedItem(null);

    if (!inputCode.trim()) return;

    const term = inputCode.trim().toLowerCase();
    const found = products.find(
      p => p.id.toLowerCase() === term || (p.codigoBarras && p.codigoBarras.toLowerCase() === term)
    );

    if (found) {
      setScannedItem(found);
    } else {
      setErrorMsg(`Nenhum item encontrado com o código "${inputCode}".`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-gray-300 rounded-lg w-full max-w-md overflow-hidden shadow-2xl my-6 flex flex-col">
        {/* AppSheet Header Bar */}
        <div className="bg-[#1a73e8] px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="w-4 h-4 text-white/90" />
            <h3 className="text-sm font-bold uppercase tracking-wide">
              Leitor de Código / Barcode
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 bg-gray-50">
          <p className="text-xs text-gray-600 leading-relaxed">
            Digite ou escaneie o ID (ex: <b>PMI-001</b>) ou Código de Barras do item:
          </p>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              autoFocus
              value={code}
              onChange={(e) => handleScanOrSearch(e.target.value)}
              placeholder="Digite o código (ex: PMI-001)..."
              className="w-full pl-8 pr-3 py-1.5 bg-white text-gray-900 font-mono text-xs rounded border border-gray-300 focus:border-[#1a73e8] focus:outline-none"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
              Atalhos de Teste Rápido:
            </span>
            <div className="flex flex-wrap gap-1">
              {products.slice(0, 4).map(p => (
                <button
                  key={p.id}
                  onClick={() => handleScanOrSearch(p.id)}
                  className="px-2 py-0.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-mono text-xs border border-gray-300 transition"
                >
                  {p.id}
                </button>
              ))}
            </div>
          </div>

          {/* Result view */}
          {scannedItem && (
            <div className="bg-white p-3 rounded-md border border-emerald-300 space-y-2">
              <div className="flex items-center space-x-1.5 text-emerald-700 text-xs font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>Produto Encontrado!</span>
              </div>

              <div className="flex items-center space-x-3">
                {(() => {
                  const photos = getProductPhotos(scannedItem);
                  const displayPhoto = photos[0] || '';
                  return displayPhoto ? (
                    <img
                      src={displayPhoto}
                      alt={scannedItem.nome}
                      className="w-12 h-12 rounded object-cover border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80';
                      }}
                    />
                  ) : null;
                })()}
                <div>
                  <span className="text-xs font-mono text-[#1a73e8] font-bold block">
                    {scannedItem.id}
                  </span>
                  <h4 className="text-xs font-bold text-gray-900 line-clamp-1">
                    {scannedItem.nome}
                  </h4>
                  <span className="text-xs text-gray-500">
                    Estoque: <strong className="text-emerald-700">{scannedItem.quantidade} un.</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectProduct(scannedItem);
                  onClose();
                }}
                className="w-full py-2 rounded bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs transition shadow"
              >
                Abrir Detalhes e Movimentação
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-300 text-red-800 text-xs px-3 py-2 rounded font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

