import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Upload, Trash2, Save, MapPin, Tag, Hash, FileText, Star, Plus, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { Product, CategoryType, ItemStatus, getProductPhotos } from '../types';
import { CATEGORIES_LIST } from '../data/mockData';
import { generateNextProductId } from '../utils/storage';

interface ProductFormModalProps {
  productToEdit?: Product | null;
  existingProducts: Product[];
  onSave: (product: Product) => void;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  productToEdit,
  existingProducts,
  onSave,
  onClose
}) => {
  const isEditing = !!productToEdit;

  const [id, setId] = useState<string>('');
  const [nome, setNome] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('CAIXA ELÉTRICA');
  const [quantidade, setQuantidade] = useState<number>(0);
  const [quantidadeMinima, setQuantidadeMinima] = useState<number>(5);
  const [fotos, setFotos] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState<string>('');
  const [localizacao, setLocalizacao] = useState<string>('');
  const [status, setStatus] = useState<ItemStatus>('Ativo');
  const [codigoBarras, setCodigoBarras] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (productToEdit) {
      setId(productToEdit.id);
      setNome(productToEdit.nome);
      setDescricao(productToEdit.descricao || '');
      setCategoria(productToEdit.categoria || 'CAIXA ELÉTRICA');
      setQuantidade(productToEdit.quantidade);
      setQuantidadeMinima(productToEdit.quantidadeMinima);
      setFotos(getProductPhotos(productToEdit));
      setLocalizacao(productToEdit.localizacao || '');
      setStatus(productToEdit.status || 'Ativo');
      setCodigoBarras(productToEdit.codigoBarras || '');
    } else {
      setId(generateNextProductId(existingProducts));
      setNome('');
      setDescricao('');
      setCategoria('CAIXA ELÉTRICA');
      setQuantidade(0);
      setQuantidadeMinima(5);
      setFotos([]);
      setLocalizacao('');
      setStatus('Ativo');
      setCodigoBarras('');
    }
  }, [productToEdit, existingProducts]);

  // Handle multiple file capture/selection from camera or picker
  const handleImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const oversized = files.find(f => f.size > 10 * 1024 * 1024);
    if (oversized) {
      setErrorMsg('Uma ou mais imagens excedem 10MB.');
      return;
    }

    const readers = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    const newImageUrls = await Promise.all(readers);
    setFotos(prev => [...prev, ...newImageUrls]);
    setErrorMsg('');

    // Reset input so user can capture or upload again
    if (e.target) e.target.value = '';
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://') && !urlInput.startsWith('data:image')) {
      setErrorMsg('Cole uma URL válida (ex: https://...)');
      return;
    }
    setFotos(prev => [...prev, urlInput.trim()]);
    setUrlInput('');
    setErrorMsg('');
  };

  const handleRemovePhoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetMainPhoto = (index: number) => {
    if (index === 0) return;
    setFotos(prev => {
      const selected = prev[index];
      const remaining = prev.filter((_, i) => i !== index);
      return [selected, ...remaining];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!id.trim()) {
      setErrorMsg('ID do Produto é obrigatório.');
      return;
    }
    if (!nome.trim()) {
      setErrorMsg('Nome do produto é obrigatório.');
      return;
    }

    if (!isEditing && existingProducts.some(p => p.id.toLowerCase() === id.trim().toLowerCase())) {
      setErrorMsg(`O ID ${id} já está em uso.`);
      return;
    }

    const mainPhoto = fotos.length > 0 ? fotos[0] : '';

    const updatedProduct: Product = {
      id: id.trim().toUpperCase(),
      nome: nome.trim(),
      descricao: descricao.trim(),
      categoria,
      quantidade: Number(quantidade) >= 0 ? Number(quantidade) : 0,
      quantidadeMinima: Number(quantidadeMinima) >= 0 ? Number(quantidadeMinima) : 0,
      foto: mainPhoto,
      fotos: fotos,
      localizacao: localizacao.trim(),
      dataCadastro: productToEdit ? productToEdit.dataCadastro : new Date().toISOString().split('T')[0],
      status,
      codigoBarras: codigoBarras.trim()
    };

    onSave(updatedProduct);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-gray-300 rounded-lg w-full max-w-xl overflow-hidden shadow-2xl my-6 flex flex-col">
        {/* AppSheet Header Bar */}
        <div className="bg-[#1a73e8] px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-white/80" />
            <h2 className="text-sm font-bold uppercase tracking-wide">
              {isEditing ? `Editar Item (${productToEdit.id})` : 'Novo Item (AppSheet Form)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[78vh] overflow-y-auto bg-gray-50">
          {errorMsg && (
            <div className="bg-red-50 border border-red-300 text-red-800 text-xs px-3 py-2 rounded font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Multiple Photos Field */}
          <div className="bg-white p-3 rounded-md border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 flex items-center space-x-1">
                <ImageIcon className="w-3.5 h-3.5 text-[#1a73e8]" />
                <span>FOTOS DO MATERIAL ({fotos.length})</span>
              </label>
              {fotos.length > 0 && (
                <span className="text-[10px] text-gray-500 font-medium">
                  ★ A 1ª foto é a capa principal
                </span>
              )}
            </div>

            {/* Photos Grid Gallery */}
            {fotos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {fotos.map((src, index) => (
                  <div
                    key={index}
                    className={`relative h-24 rounded border overflow-hidden group bg-gray-100 flex items-center justify-center ${
                      index === 0 ? 'border-2 border-[#1a73e8] shadow-2xs' : 'border-gray-300'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Badge for main photo */}
                    {index === 0 ? (
                      <span className="absolute top-1 left-1 bg-[#1a73e8] text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow">
                        Capa
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetMainPhoto(index)}
                        className="absolute top-1 left-1 bg-black/60 hover:bg-[#1a73e8] text-white p-1 rounded opacity-0 group-hover:opacity-100 transition shadow"
                        title="Definir como capa principal"
                      >
                        <Star className="w-3 h-3" />
                      </button>
                    )}

                    {/* Delete Photo Button */}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded shadow transition"
                      title="Remover esta foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-gray-200 rounded text-center text-gray-400">
                <Camera className="w-8 h-8 mx-auto stroke-1 mb-1 text-gray-300" />
                <p className="text-xs font-medium">Nenhuma foto adicionada ainda.</p>
                <p className="text-[10px] text-gray-400">Tire fotos com a câmera ou selecione várias da galeria.</p>
              </div>
            )}

            {/* Upload Action Controls */}
            <div className="space-y-2 pt-1 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs transition shadow-2xs"
                >
                  <Camera className="w-4 h-4" />
                  <span>Tirar Foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs border border-gray-300 transition"
                >
                  <Upload className="w-4 h-4 text-[#1a73e8]" />
                  <span>Galeria (Várias)</span>
                </button>
              </div>

              {/* Hidden File Inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageFiles}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFiles}
                className="hidden"
              />

              {/* Add Image URL Row */}
              <div className="flex items-center space-x-1.5 pt-1">
                <input
                  type="url"
                  placeholder="Ou cole a URL da foto (https://...)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 text-xs bg-gray-50 text-gray-800 border border-gray-300 rounded px-2.5 py-1.5 focus:border-[#1a73e8] focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs border border-gray-300 transition shrink-0"
                >
                  + Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* ID & Name Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                ID CÓDIGO <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="PMI-001"
                disabled={isEditing}
                className="w-full bg-gray-50 text-gray-900 font-mono font-bold border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:border-[#1a73e8] focus:bg-white focus:outline-none disabled:opacity-60"
              />
            </div>

            <div className="sm:col-span-2 bg-white p-3 rounded-md border border-gray-200">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                NOME DO MATERIAL <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Disjuntor Tripolar 63A"
                className="w-full bg-gray-50 text-gray-900 font-bold border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:border-[#1a73e8] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Location Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-md border border-gray-200">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                CATEGORIA
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-gray-50 text-gray-800 border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:border-[#1a73e8] focus:outline-none"
              >
                {CATEGORIES_LIST.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="bg-white p-3 rounded-md border border-gray-200">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                LOCALIZAÇÃO
              </label>
              <input
                type="text"
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                placeholder="Prateleira A-2"
                className="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:border-[#1a73e8] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-md border border-gray-200">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                QUANTIDADE
              </label>
              <input
                type="number"
                min="0"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-full bg-gray-50 text-gray-900 font-black border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:border-[#1a73e8] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                MÍNIMO ALERTA
              </label>
              <input
                type="number"
                min="0"
                value={quantidadeMinima}
                onChange={(e) => setQuantidadeMinima(Number(e.target.value))}
                className="w-full bg-gray-50 text-amber-700 font-black border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:border-[#1a73e8] focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-3 rounded-md border border-gray-200">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              OBSERVAÇÕES / DETALHES
            </label>
            <textarea
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Especificações do item..."
              className="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:border-[#1a73e8] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="p-2 border-t border-gray-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1 px-4 py-2 rounded bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold transition shadow"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Salvar' : 'Cadastrar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

