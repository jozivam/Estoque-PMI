import React, { useState } from 'react';
import { X, Plus, Minus, Edit3, MapPin, Tag, Calendar, CheckCircle2, XCircle, AlertTriangle, Hash, FileText, ChevronLeft, ChevronRight, Maximize2, Image as ImageIcon } from 'lucide-react';
import { Product, getProductPhotos } from '../types';
import { ImageViewerModal } from './ImageViewerModal';

interface ProductDetailModalProps {
  product: Product;
  onOpenMovementModal: (product: Product, defaultType: 'Entrada' | 'Saída') => void;
  onEditProduct: (product: Product) => void;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onOpenMovementModal,
  onEditProduct,
  onClose
}) => {
  const isLowStock = product.quantidade <= product.quantidadeMinima;
  const isOutOfStock = product.quantidade === 0;

  const photos = getProductPhotos(product);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [showFullImage, setShowFullImage] = useState<boolean>(false);

  const activePhoto = photos.length > 0 ? photos[activePhotoIndex] || photos[0] : '';

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white border border-gray-300 rounded-lg w-full max-w-lg overflow-hidden shadow-2xl my-4 flex flex-col">
          {/* AppSheet Header Bar */}
          <div className="bg-[#1a73e8] px-4 py-3 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold bg-white/20 text-white px-2 py-0.5 rounded">
                {product.id}
              </span>
              <h2 className="text-sm font-bold tracking-tight uppercase truncate max-w-[240px]">
                {product.nome}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-white/80 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Detail Content Body */}
          <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto bg-gray-50">
            {/* Main Photo Deck with Multi-Photo Controls */}
            {photos.length > 0 ? (
              <div className="space-y-2">
                <div
                  onClick={() => setShowFullImage(true)}
                  className="w-full h-56 rounded-md overflow-hidden bg-gray-200 border border-gray-300 shadow-2xs relative group cursor-pointer"
                >
                  <img
                    src={activePhoto}
                    alt={`${product.nome} - Foto ${activePhotoIndex + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80';
                    }}
                  />

                  <div className="absolute top-2 right-2 bg-black/70 text-white text-[11px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                    {product.categoria}
                  </div>

                  {/* Photo Counter Badge */}
                  {photos.length > 1 && (
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs flex items-center space-x-1">
                      <ImageIcon className="w-3 h-3 text-[#1a73e8]" />
                      <span>{activePhotoIndex + 1} / {photos.length}</span>
                    </div>
                  )}

                  {/* Zoom hint */}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white p-1 rounded backdrop-blur-xs opacity-80 group-hover:opacity-100 transition">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>

                  {/* Left / Right Carousel Arrows */}
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevPhoto}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-[#1a73e8] text-white p-1.5 rounded-full backdrop-blur-xs transition shadow"
                        title="Foto anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNextPhoto}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-[#1a73e8] text-white p-1.5 rounded-full backdrop-blur-xs transition shadow"
                        title="Próxima foto"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {photos.length > 1 && (
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-0.5">
                    {photos.map((src, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`w-14 h-14 rounded border overflow-hidden shrink-0 transition relative ${
                          activePhotoIndex === idx
                            ? 'border-2 border-[#1a73e8] ring-2 ring-blue-100'
                            : 'border-gray-300 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={src}
                          alt={`Miniatura ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-32 rounded-md bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                Nenhuma imagem cadastrada
              </div>
            )}

          {/* AppSheet Field Sections */}
          <div className="space-y-2">
            {/* Field: Nome */}
            <div className="bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                NOME DO ITEM
              </span>
              <span className="text-sm font-bold text-gray-900 block">
                {product.nome}
              </span>
            </div>

            {/* Field: Quantidade & Alerta */}
            <div className={`p-3 rounded-md border shadow-2xs ${
              isOutOfStock
                ? 'bg-red-50 border-red-200'
                : isLowStock
                ? 'bg-amber-50 border-amber-200'
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-0.5">
                    ESTOQUE ATUAL
                  </span>
                  <div className="flex items-baseline space-x-1">
                    <span className={`text-2xl font-black ${isLowStock ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {product.quantidade}
                    </span>
                    <span className="text-xs text-gray-500 font-semibold">unidades</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                    MÍNIMO EXIGIDO
                  </span>
                  <span className="text-sm font-bold text-gray-700">
                    {product.quantidadeMinima} un.
                  </span>
                </div>
              </div>

              {isLowStock && (
                <div className="mt-2 pt-2 border-t border-amber-200/80 text-amber-800 text-xs font-semibold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Estoque Crítico — Reabastecimento necessário!</span>
                </div>
              )}
            </div>

            {/* Field Grid: Categoria & Localização */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                  CATEGORIA
                </span>
                <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded inline-block">
                  {product.categoria}
                </span>
              </div>

              <div className="bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                  LOCALIZAÇÃO
                </span>
                <span className="text-xs font-bold text-gray-800 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1a73e8]" />
                  <span>{product.localizacao || 'Almoxarifado Geral'}</span>
                </span>
              </div>
            </div>

            {/* Field: Descrição */}
            {product.descricao && (
              <div className="bg-white p-3 rounded-md border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                  DESCRIÇÃO / ESPECIFICAÇÕES
                </span>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {product.descricao}
                </p>
              </div>
            )}

            {/* Metadata Footer */}
            <div className="bg-white p-3 rounded-md border border-gray-200 shadow-2xs flex items-center justify-between text-xs text-gray-500">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                  STATUS
                </span>
                <span className={`font-bold ${product.status === 'Ativo' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {product.status}
                </span>
              </div>

              {product.codigoBarras && (
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                    CÓDIGO DE BARRAS
                  </span>
                  <span className="font-mono text-gray-800 font-bold">
                    {product.codigoBarras}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AppSheet Fixed Action Bar (Bottom Actions) */}
        <div className="p-3 bg-white border-t border-gray-200 grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenMovementModal(product, 'Saída');
            }}
            disabled={product.quantidade === 0}
            className="flex items-center justify-center space-x-1 py-2.5 px-2 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-2xs transition disabled:opacity-40"
          >
            <Minus className="w-4 h-4 stroke-[2.5]" />
            <span>- Saída</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenMovementModal(product, 'Entrada');
            }}
            className="flex items-center justify-center space-x-1 py-2.5 px-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Entrada</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onEditProduct(product);
            }}
            className="flex items-center justify-center space-x-1 py-2.5 px-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs border border-gray-300 transition"
          >
            <Edit3 className="w-4 h-4 text-gray-600" />
            <span>Editar</span>
          </button>
        </div>
      </div>
    </div>

      {showFullImage && activePhoto && (
        <ImageViewerModal
          imageSrc={activePhoto}
          title={`${product.nome} (Foto ${activePhotoIndex + 1} de ${photos.length})`}
          onClose={() => setShowFullImage(false)}
        />
      )}
    </>
  );
};
