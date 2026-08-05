import React, { useState, useEffect } from 'react';
import {
  loadProducts,
  saveProducts,
  loadMovements,
  saveMovements,
  recordStockMovement,
  loadSheetsConfig,
  saveSheetsConfig,
  resetToSampleData
} from './utils/storage';
import { Product, Movement, ActiveTab, GoogleSheetsConfig } from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ProductList } from './components/ProductList';
import { ProductFormModal } from './components/ProductFormModal';
import { StockMovementModal } from './components/StockMovementModal';
import { MovementHistory } from './components/MovementHistory';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { ImageViewerModal } from './components/ImageViewerModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { QrCode, Plus, AlertTriangle, FileSpreadsheet, Package } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>({ sheetId: '', autoSync: false });

  const [activeTab, setActiveTab] = useState<ActiveTab>('estoque');

  // Modals state
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [showMovementModal, setShowMovementModal] = useState<boolean>(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | null>(null);
  const [movementDefaultType, setMovementDefaultType] = useState<'Entrada' | 'Saída'>('Entrada');

  const [showSheetsModal, setShowSheetsModal] = useState<boolean>(false);
  const [showImageViewerModal, setShowImageViewerModal] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string }>({ src: '', title: '' });

  const [showBarcodeScannerModal, setShowBarcodeScannerModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Initial load
  useEffect(() => {
    const loadedProds = loadProducts();
    const loadedMovs = loadMovements();
    const loadedConfig = loadSheetsConfig();

    setProducts(loadedProds);
    setMovements(loadedMovs);
    setSheetsConfig(loadedConfig);
  }, []);

  // Show floating toast notification
  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Open add product form
  const handleOpenAddModal = () => {
    setProductToEdit(null);
    setShowFormModal(true);
  };

  // Open edit product form
  const handleOpenEditModal = (product: Product) => {
    setProductToEdit(product);
    setShowFormModal(true);
  };

  // Save product (Add or Edit)
  const handleSaveProduct = (updatedProduct: Product) => {
    let newProductsList: Product[];
    const exists = products.some(p => p.id === updatedProduct.id);

    if (exists) {
      newProductsList = products.map(p => (p.id === updatedProduct.id ? updatedProduct : p));
      showNotification(`Produto ${updatedProduct.id} atualizado com sucesso!`);
    } else {
      newProductsList = [updatedProduct, ...products];
      showNotification(`Produto ${updatedProduct.id} cadastrado no estoque!`);
    }

    setProducts(newProductsList);
    saveProducts(newProductsList);
    setShowFormModal(false);
  };

  // Open movement modal
  const handleOpenMovementModal = (product: Product, defaultType: 'Entrada' | 'Saída') => {
    setSelectedProductForMovement(product);
    setMovementDefaultType(defaultType);
    setShowMovementModal(true);
  };

  // Confirm Movement (+ Entrada or - Saída)
  const handleConfirmMovement = (
    productId: string,
    tipo: 'Entrada' | 'Saída',
    quantidade: number,
    responsavel: string,
    observacao?: string,
    notaFiscal?: string
  ) => {
    try {
      const { updatedProducts, newMovement } = recordStockMovement(
        productId,
        tipo,
        quantidade,
        responsavel,
        observacao,
        notaFiscal
      );

      setProducts(updatedProducts);
      setMovements([newMovement, ...movements]);
      setShowMovementModal(false);

      showNotification(`${tipo} de ${quantidade} un. registrada para ${productId}!`);
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar movimentação');
    }
  };

  // Open image modal
  const handleViewImage = (src: string, title: string) => {
    setSelectedImage({ src, title });
    setShowImageViewerModal(true);
  };

  // Reset demo data
  const handleResetData = () => {
    if (confirm('Deseja restaurar os dados demonstrativos do estoque PMI?')) {
      const { products: resetProds, movements: resetMovs } = resetToSampleData();
      setProducts(resetProds);
      setMovements(resetMovs);
      showNotification('Dados restaurados para o padrão de exemplo.');
      setShowSheetsModal(false);
    }
  };

  // Import products JSON
  const handleImportData = (importedProducts: Product[]) => {
    setProducts(importedProducts);
    saveProducts(importedProducts);
    showNotification(`${importedProducts.length} itens importados com sucesso!`);
    setShowSheetsModal(false);
  };

  const activeProducts = products.filter(p => p.status === 'Ativo');
  const criticalProducts = activeProducts.filter(p => p.quantidade <= p.quantidadeMinima);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans pb-20 md:pb-8">
      {/* App Main Header */}
      <Header
        products={products}
        onOpenSheetsModal={() => setShowSheetsModal(true)}
        onOpenAlertsTab={() => setActiveTab('alertas')}
      />

      {/* Main Responsive Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'cadastrar') {
            handleOpenAddModal();
          } else {
            setActiveTab(tab);
          }
        }}
        criticalCount={criticalProducts.length}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-[#1a73e8] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl border border-blue-400 flex items-center space-x-2 animate-bounce">
          <Package className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 sm:px-6">
        {/* Floating Quick Camera Scanner Bar for Smartphone Field Use */}
        <div className="mb-4 bg-white border border-gray-200 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-50 text-[#1a73e8]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block">Busca Rápida de Campo</span>
              <span className="text-[10px] text-gray-500">Digite ou escaneie a etiqueta ID / Código de barras</span>
            </div>
          </div>

          <button
            id="btn-open-qr-scanner"
            onClick={() => setShowBarcodeScannerModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold transition active:scale-95 shadow-2xs"
          >
            <QrCode className="w-4 h-4" />
            <span>Buscar ID</span>
          </button>
        </div>

        {/* Tab 1: Estoque Principal */}
        {activeTab === 'estoque' && (
          <ProductList
            products={products}
            onOpenMovementModal={handleOpenMovementModal}
            onEditProduct={handleOpenEditModal}
            onOpenAddModal={handleOpenAddModal}
            onViewImage={handleViewImage}
            initialFilterLowStock={false}
          />
        )}

        {/* Tab 2: Movimentações / Histórico */}
        {activeTab === 'movimentacoes' && (
          <MovementHistory movements={movements} />
        )}

        {/* Tab 3: Alertas de Estoque Baixo */}
        {activeTab === 'alertas' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-amber-900">
                  Painel de Alertas — Nível Crítico de Estoque
                </h2>
                <p className="text-xs text-amber-800">
                  Itens cuja quantidade atual é menor ou igual à quantidade mínima cadastrada para o almoxarifado.
                </p>
              </div>
            </div>

            <ProductList
              products={products}
              onOpenMovementModal={handleOpenMovementModal}
              onEditProduct={handleOpenEditModal}
              onOpenAddModal={handleOpenAddModal}
              onViewImage={handleViewImage}
              initialFilterLowStock={true}
            />
          </div>
        )}

        {/* Tab 4: Configurações & Sincronização Google Sheets */}
        {activeTab === 'configuracoes' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Integração Google Sheets (Estoque PMI 2.0)</h2>
                  <p className="text-xs text-gray-500">
                    Sincronização com planilha Google em tempo real e arquivos de exportação.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-2 text-gray-700">
                <p className="font-semibold text-gray-900">Estrutura Sugerida de Abas no Google Sheets:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li><strong className="text-gray-900">Pagina1 (Itens)</strong>: ID_PRODUTO, NOME, DESCRICAO, CATEGORIA, FOTO, QUANTIDADE, QUANTIDADE_MINIMA, LOCALIZACAO, DATA_CADASTRO, STATUS</li>
                  <li><strong className="text-gray-900">MOVIMENTACOES (Histórico)</strong>: ID_MOVIMENTACAO, ID_PRODUTO, TIPO, QUANTIDADE, DATA, RESPONSAVEL, OBSERVACAO</li>
                  <li><strong className="text-gray-900">CATEGORIAS</strong>: CAIXA ELÉTRICA, EQUIPAMENTO, PAINEL, FERRAMENTA, CABO, OUTROS</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setShowSheetsModal(true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs shadow-2xs transition"
                >
                  Abrir Central de Sincronização & CSV
                </button>

                <button
                  onClick={handleResetData}
                  className="py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 text-xs font-semibold transition"
                >
                  Restaurar Estoque Demonstrativo
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {/* Product Add / Edit Modal */}
      {showFormModal && (
        <ProductFormModal
          productToEdit={productToEdit}
          existingProducts={products}
          onSave={handleSaveProduct}
          onClose={() => setShowFormModal(false)}
        />
      )}

      {/* Stock Movement Modal (+ Entrada / - Saída) */}
      {showMovementModal && selectedProductForMovement && (
        <StockMovementModal
          product={selectedProductForMovement}
          defaultType={movementDefaultType}
          onConfirm={handleConfirmMovement}
          onClose={() => setShowMovementModal(false)}
        />
      )}

      {/* Google Sheets Modal */}
      {showSheetsModal && (
        <GoogleSheetsModal
          products={products}
          movements={movements}
          sheetsConfig={sheetsConfig}
          onUpdateConfig={(cfg) => {
            setSheetsConfig(cfg);
            saveSheetsConfig(cfg);
          }}
          onResetData={handleResetData}
          onImportData={handleImportData}
          onClose={() => setShowSheetsModal(false)}
        />
      )}

      {/* Photo Zoom Modal */}
      {showImageViewerModal && (
        <ImageViewerModal
          imageSrc={selectedImage.src}
          title={selectedImage.title}
          onClose={() => setShowImageViewerModal(false)}
        />
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScannerModal && (
        <BarcodeScannerModal
          products={products}
          onSelectProduct={(product) => handleOpenMovementModal(product, 'Saída')}
          onClose={() => setShowBarcodeScannerModal(false)}
        />
      )}
    </div>
  );
}
