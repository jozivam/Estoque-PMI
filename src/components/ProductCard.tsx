import React from 'react';
import { Plus, Minus, MapPin, Edit3, AlertTriangle, Image as ImageIcon, Eye, Camera } from 'lucide-react';
import { Product, getProductPhotos } from '../types';

interface ProductCardProps {
  product: Product;
  onOpenMovementModal: (product: Product, defaultType: 'Entrada' | 'Saída') => void;
  onEditProduct: (product: Product) => void;
  onViewDetail: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenMovementModal,
  onEditProduct,
  onViewDetail
}) => {
  const isLowStock = false;
  const isOutOfStock = product.quantidade === 0;

  const photos = getProductPhotos(product);
  const mainPhoto = photos[0] || product.foto || '';

  return (
    <div
      className={`bg-white border rounded-lg shadow-2xs hover:shadow-md transition duration-150 overflow-hidden flex flex-col justify-between group ${
        isOutOfStock
          ? 'border-red-300 bg-red-50/20'
          : isLowStock
          ? 'border-amber-300 bg-amber-50/20'
          : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      {/* Top Deck Card Row (Click to open Detail) */}
      <div
        onClick={() => onViewDetail(product)}
        className="p-3 cursor-pointer select-none"
      >
        <div className="flex items-start space-x-3">
          {/* Left Thumbnail (AppSheet Deck style) */}
          <div className="w-16 h-16 rounded-md bg-gray-100 overflow-hidden border border-gray-200 shrink-0 relative group-hover:border-blue-400 transition">
            {mainPhoto ? (
              <>
                <img
                  src={mainPhoto}
                  alt={product.nome}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80';
                  }}
                />
                {photos.length > 1 && (
                  <div className="absolute bottom-0 right-0 bg-black/75 text-white text-[9px] font-bold px-1 py-0.2 rounded-tl flex items-center space-x-0.5">
                    <Camera className="w-2.5 h-2.5" />
                    <span>{photos.length}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ImageIcon className="w-6 h-6 stroke-1" />
              </div>
            )}
          </div>

          {/* Middle Information Column */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5 mb-0.5">
              <span className="text-[10px] font-mono font-bold bg-[#1a73e8] text-white px-1.5 py-0.2 rounded">
                {product.id}
              </span>
              <span className="text-[10px] font-semibold text-gray-500 truncate bg-gray-100 px-1.5 py-0.2 rounded">
                {product.categoria}
              </span>
            </div>

            <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-[#1a73e8] transition">
              {product.nome}
            </h3>

            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <span className="flex items-center space-x-1 truncate max-w-[130px]">
                <MapPin className="w-3 h-3 text-[#1a73e8] shrink-0" />
                <span className="truncate">{product.localizacao || 'Almoxarifado'}</span>
              </span>
            </div>
          </div>

          {/* Right Quantity & Stock Badge */}
          <div className="text-right shrink-0">
            <div className={`px-2 py-1 rounded text-xs font-bold inline-block ${
              isOutOfStock
                ? 'bg-red-100 text-red-800 border border-red-200'
                : isLowStock
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              <span className="text-sm font-black">{product.quantidade}</span>
              <span className="text-[10px] ml-0.5 font-normal">un.</span>
            </div>

            {isLowStock && (
              <div className="flex items-center space-x-0.5 text-[10px] font-bold text-amber-700 mt-1 justify-end">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Crítico</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AppSheet Inline Quick Actions Bar */}
      <div className="bg-gray-50 px-3 py-2 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={() => onViewDetail(product)}
          className="text-xs font-semibold text-[#1a73e8] hover:underline flex items-center space-x-1"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Detalhes</span>
        </button>

        <div className="flex items-center space-x-1">
          <button
            id={`btn-saida-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenMovementModal(product, 'Saída');
            }}
            disabled={product.quantidade === 0}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs transition disabled:opacity-40"
            title="Registrar Saída"
          >
            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Saída</span>
          </button>

          <button
            id={`btn-entrada-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenMovementModal(product, 'Entrada');
            }}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition"
            title="Registrar Entrada"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Entrada</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditProduct(product);
            }}
            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
            title="Editar Produto"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

