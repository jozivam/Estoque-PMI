import React, { useState, useMemo } from 'react';
import { Search, Filter, AlertTriangle, Plus, SlidersHorizontal, PackageX, LayoutList, Table, LayoutGrid, Eye, Minus, Edit3, Camera } from 'lucide-react';
import { Product, CategoryType, getProductPhotos } from '../types';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { CATEGORIES_LIST } from '../data/mockData';

interface ProductListProps {
  products: Product[];
  onOpenMovementModal: (product: Product, defaultType: 'Entrada' | 'Saída') => void;
  onEditProduct: (product: Product) => void;
  onOpenAddModal: () => void;
  onViewImage: (imageSrc: string, title: string) => void;
  initialFilterLowStock?: boolean;
}

export type ViewType = 'deck' | 'tabela' | 'galeria';

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onOpenMovementModal,
  onEditProduct,
  onOpenAddModal,
  onViewImage,
  initialFilterLowStock = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState<boolean>(initialFilterLowStock);
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'nome' | 'quantidade-asc' | 'quantidade-desc' | 'critico'>('critico');
  const [viewType, setViewType] = useState<ViewType>('deck');

  // Detail Modal State
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);

  // Filter products based on search term, category, low stock, status
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Status filter
      if (!showInactive && p.status === 'Inativo') return false;

      // Low stock filter
      if (filterLowStockOnly && p.quantidade > p.quantidadeMinima) return false;

      // Category filter
      if (selectedCategory !== 'TODAS' && p.categoria !== selectedCategory) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = p.nome.toLowerCase().includes(term);
        const matchesId = p.id.toLowerCase().includes(term);
        const matchesDesc = (p.descricao || '').toLowerCase().includes(term);
        const matchesLoc = (p.localizacao || '').toLowerCase().includes(term);
        const matchesBar = (p.codigoBarras || '').toLowerCase().includes(term);
        return matchesName || matchesId || matchesDesc || matchesLoc || matchesBar;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'critico') {
        const aRatio = a.quantidade / (a.quantidadeMinima || 1);
        const bRatio = b.quantidade / (b.quantidadeMinima || 1);
        return aRatio - bRatio;
      }
      if (sortBy === 'nome') {
        return a.nome.localeCompare(b.nome);
      }
      if (sortBy === 'quantidade-asc') {
        return a.quantidade - b.quantidade;
      }
      if (sortBy === 'quantidade-desc') {
        return b.quantidade - a.quantidade;
      }
      return 0;
    });
  }, [products, searchTerm, selectedCategory, filterLowStockOnly, showInactive, sortBy]);

  return (
    <div className="space-y-3">
      {/* Search & View Mode Switcher Header Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-2xs space-y-3">
        {/* Search Input Box */}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              id="input-search-products"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nome, ID, Descrição ou Prateleira..."
              className="w-full pl-9 pr-8 py-2 bg-gray-50 text-gray-900 rounded-md border border-gray-300 focus:border-[#1a73e8] focus:bg-white focus:outline-none text-xs placeholder-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-xs text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* AppSheet View Switcher Buttons (Deck / Tabela / Galeria) */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-md border border-gray-200 shrink-0">
            <button
              onClick={() => setViewType('deck')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-semibold transition ${
                viewType === 'deck'
                  ? 'bg-white text-[#1a73e8] shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Visão Deck (AppSheet)"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Deck</span>
            </button>

            <button
              onClick={() => setViewType('tabela')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-semibold transition ${
                viewType === 'tabela'
                  ? 'bg-white text-[#1a73e8] shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Visão Tabela (Google Sheets)"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabela</span>
            </button>

            <button
              onClick={() => setViewType('galeria')}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-semibold transition ${
                viewType === 'galeria'
                  ? 'bg-white text-[#1a73e8] shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Visão Galeria (Fotos)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Galeria</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Buttons & Sorting Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
          {/* Low Stock Toggle Pill */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-filter-low-stock"
              onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                filterLowStockOnly
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Apenas Estoque Baixo</span>
            </button>

            <button
              id="btn-toggle-inactive"
              onClick={() => setShowInactive(!showInactive)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                showInactive
                  ? 'bg-blue-50 text-[#1a73e8] border border-blue-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {showInactive ? 'Com Inativos' : '+ Inativos'}
            </button>
          </div>

          {/* Sort selector */}
          <div className="flex items-center space-x-1.5 text-gray-500">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Ordenar:</span>
            <select
              id="select-sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-50 text-gray-800 border border-gray-200 rounded-md px-2 py-0.5 focus:outline-none focus:border-[#1a73e8]"
            >
              <option value="critico">Críticos Primeiro</option>
              <option value="nome">Nome (A-Z)</option>
              <option value="quantidade-desc">Maior Estoque</option>
              <option value="quantidade-asc">Menor Estoque</option>
            </select>
          </div>
        </div>

        {/* Category Chips Horizontal Scroll */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 pt-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('TODAS')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'TODAS'
                ? 'bg-[#1a73e8] text-white'
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            Todas Categorias
          </button>
          {CATEGORIES_LIST.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-[#1a73e8] text-white font-semibold'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Count Summary */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>Exibindo <strong>{filteredProducts.length}</strong> de {products.length} registros</span>
        <span className="font-semibold text-gray-700 capitalize">Modo: {viewType}</span>
      </div>

      {/* VIEW RENDERERS */}
      {filteredProducts.length > 0 ? (
        <>
          {/* MODE 1: DECK VIEW (AppSheet Cards) */}
          {viewType === 'deck' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenMovementModal={onOpenMovementModal}
                  onEditProduct={onEditProduct}
                  onViewDetail={(p) => setSelectedDetailProduct(p)}
                />
              ))}
            </div>
          )}

          {/* MODE 2: TABELA VIEW (Google Sheets Table) */}
          {viewType === 'tabela' && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-2xs overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-gray-800">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                    <th className="p-3">ID</th>
                    <th className="p-3">Foto</th>
                    <th className="p-3">Nome do Item</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3 text-center">Estoque</th>
                    <th className="p-3">Localização</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map(product => {
                    const isLow = product.quantidade <= product.quantidadeMinima;
                    const photos = getProductPhotos(product);
                    const mainPhoto = photos[0] || product.foto || '';

                    return (
                      <tr
                        key={product.id}
                        onClick={() => setSelectedDetailProduct(product)}
                        className="hover:bg-blue-50/40 cursor-pointer transition"
                      >
                        <td className="p-3 font-mono font-bold text-[#1a73e8]">
                          {product.id}
                        </td>
                        <td className="p-3">
                          {mainPhoto ? (
                            <div className="relative w-8 h-8 rounded border border-gray-200 overflow-hidden shrink-0">
                              <img src={mainPhoto} alt="" className="w-full h-full object-cover" />
                              {photos.length > 1 && (
                                <span className="absolute bottom-0 right-0 bg-black/75 text-white text-[8px] font-bold px-0.5">
                                  {photos.length}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-[9px]">
                              Sem foto
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-bold text-gray-900">
                          {product.nome}
                        </td>
                        <td className="p-3">
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                            {product.categoria}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-black text-xs ${
                            isLow ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {product.quantidade} un.
                          </span>
                        </td>
                        <td className="p-3 text-gray-600">
                          {product.localizacao || 'Almoxarifado'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onOpenMovementModal(product, 'Entrada')}
                              className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold hover:bg-emerald-100 transition"
                            >
                              + Entrada
                            </button>
                            <button
                              onClick={() => onOpenMovementModal(product, 'Saída')}
                              disabled={product.quantidade === 0}
                              className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded font-bold hover:bg-red-100 transition disabled:opacity-40"
                            >
                              - Saída
                            </button>
                            <button
                              onClick={() => onEditProduct(product)}
                              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* MODE 3: GALERIA VIEW (Photo Grid) */}
          {viewType === 'galeria' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map(product => {
                const isLow = product.quantidade <= product.quantidadeMinima;
                const photos = getProductPhotos(product);
                const mainPhoto = photos[0] || product.foto || '';

                return (
                  <div
                    key={product.id}
                    onClick={() => setSelectedDetailProduct(product)}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="relative h-36 bg-gray-100 overflow-hidden">
                      {mainPhoto ? (
                        <>
                          <img
                            src={mainPhoto}
                            alt={product.nome}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          {photos.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                              <Camera className="w-3 h-3 text-[#1a73e8]" />
                              <span>{photos.length} fotos</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-medium">
                          Sem Imagem
                        </div>
                      )}

                      <div className="absolute top-2 left-2 bg-[#1a73e8] text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-2xs">
                        {product.id}
                      </div>

                      <div className={`absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-black shadow-2xs ${
                        isLow ? 'bg-amber-400 text-gray-900' : 'bg-emerald-600 text-white'
                      }`}>
                        {product.quantidade} un.
                      </div>
                    </div>

                    <div className="p-2.5">
                      <h4 className="font-bold text-gray-900 text-xs truncate group-hover:text-[#1a73e8] transition">
                        {product.nome}
                      </h4>
                      <span className="text-[10px] text-gray-500 block truncate">
                        {product.categoria} • {product.localizacao || 'Almoxarifado'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
            <PackageX className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">Nenhum item encontrado</h3>
            <p className="text-xs text-gray-500 mb-3">
              Não encontramos nenhum registro para os filtros atuais.
            </p>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded bg-[#1a73e8] text-white font-bold text-xs shadow hover:bg-[#1557b0] transition"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Produto</span>
            </button>
          </div>
        </div>
      )}

      {/* APPSHEET DETAIL VIEW MODAL */}
      {selectedDetailProduct && (
        <ProductDetailModal
          product={selectedDetailProduct}
          onOpenMovementModal={onOpenMovementModal}
          onEditProduct={onEditProduct}
          onClose={() => setSelectedDetailProduct(null)}
        />
      )}
    </div>
  );
};

