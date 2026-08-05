import React, { useState, useEffect } from 'react';
import {
  loadProducts,
  loadMovements,
  loadSheetsConfig,
  saveSheetsConfig,
} from './utils/storage';
import {
  getLocalProducts,
  getLocalMovements,
  getSyncQueue,
  resetLocalDatabase
} from './utils/db';
import {
  processSyncQueue,
  pullDataFromGoogle,
  syncSaveProduct,
  syncSaveMovement
} from './utils/sync';
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
import { QrCode, Plus, AlertTriangle, FileSpreadsheet, Package, Wifi, WifiOff, Share2, Printer, ExternalLink } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>({ sheetId: '', scriptUrl: '', autoSync: false });
  const [syncQueueCount, setSyncQueueCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

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
    const initApp = async () => {
      const loadedConfig = loadSheetsConfig();
      setSheetsConfig(loadedConfig);
      saveSheetsConfig(loadedConfig);

      let loadedProds = await getLocalProducts();
      let loadedMovs = await getLocalMovements();

      // Se estiver online, sempre tenta sincronizar e baixar os dados mais recentes do Sheets na abertura
      if (navigator.onLine && loadedConfig.scriptUrl) {
        try {
          // Processa qualquer pendência local primeiro
          await processSyncQueue(loadedConfig.scriptUrl);
          // Baixa os dados atualizados do Sheets
          const pullRes = await pullDataFromGoogle(loadedConfig.scriptUrl);
          if (pullRes.success && pullRes.products) {
            loadedProds = pullRes.products;
            loadedMovs = pullRes.movements || [];
          }
        } catch (e) {
          console.error("Erro ao sincronizar com Google Sheets no carregamento:", e);
        }
      }

      // Se o banco local estiver vazio (ex: offline na 1ª vez), carrega os mock data de exemplo
      if (loadedProds.length === 0 && loadedMovs.length === 0) {
        const initialProducts = loadProducts();
        const initialMovements = loadMovements();
        await resetLocalDatabase(initialProducts, initialMovements);
        loadedProds = initialProducts;
        loadedMovs = initialMovements as any;
      }

      setProducts(loadedProds);
      setMovements(loadedMovs as any);

      const queue = await getSyncQueue();
      setSyncQueueCount(queue.length);
    };

    initApp();
  }, []);

  // Monitorar rede e sincronizar automático ao voltar a ter internet
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(true);
      if (sheetsConfig.autoSync && sheetsConfig.scriptUrl) {
        showNotification("Conexão reestabelecida! Sincronizando...");
        processSyncQueue(sheetsConfig.scriptUrl).then(async (res) => {
          if (res.success && res.syncedCount > 0) {
            const finalProds = await getLocalProducts();
            const finalMovs = await getLocalMovements();
            setProducts(finalProds);
            setMovements(finalMovs as any);
            setSyncQueueCount(0);
            showNotification(`Sincronização concluída (${res.syncedCount} itens).`);
          }
        }).catch(err => console.error(err));
      }
    };

    const handleOfflineStatus = () => {
      setIsOnline(false);
      showNotification("Modo Offline ativado. Alterações serão salvas localmente.");
    };

    const handleBackgroundSyncCompleted = async () => {
      const finalProds = await getLocalProducts();
      const finalMovs = await getLocalMovements();
      const queue = await getSyncQueue();
      setProducts(finalProds);
      setMovements(finalMovs as any);
      setSyncQueueCount(queue.length);
      showNotification("Dados sincronizados com o Google Sheets!");
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    window.addEventListener('sync-completed', handleBackgroundSyncCompleted);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
      window.removeEventListener('sync-completed', handleBackgroundSyncCompleted);
    };
  }, [sheetsConfig]);

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
  const handleSaveProduct = async (updatedProduct: Product) => {
    try {
      const oldProduct = products.find(p => p.id === updatedProduct.id);
      const exists = !!oldProduct;

      // Salva localmente (IndexedDB) e agenda sincronização
      const syncResult = await syncSaveProduct(updatedProduct, sheetsConfig.scriptUrl || '');

      let newProductsList: Product[];
      let newMovementsList = [...movements];

      // Determina se precisamos gerar uma movimentação automática para o histórico
      let newMovement: Movement | null = null;
      if (!exists && updatedProduct.quantidade > 0) {
        newMovement = {
          id: `MOV-${Date.now().toString().slice(-6)}`,
          produtoId: updatedProduct.id,
          produtoNome: updatedProduct.nome,
          tipo: 'Entrada',
          quantidade: updatedProduct.quantidade,
          data: new Date().toISOString(),
          responsavel: 'Almoxarife / Cadastro',
          observacao: 'Cadastro inicial do produto.',
          notaFiscal: ''
        };
      } else if (exists && oldProduct && oldProduct.quantidade !== updatedProduct.quantidade) {
        const diff = updatedProduct.quantidade - oldProduct.quantidade;
        newMovement = {
          id: `MOV-${Date.now().toString().slice(-6)}`,
          produtoId: updatedProduct.id,
          produtoNome: updatedProduct.nome,
          tipo: diff > 0 ? 'Entrada' : 'Saída',
          quantidade: Math.abs(diff),
          data: new Date().toISOString(),
          responsavel: 'Almoxarife / Ajuste',
          observacao: 'Ajuste de quantidade via edição de cadastro.',
          notaFiscal: ''
        };
      }

      if (newMovement) {
        const syncResultMov = await syncSaveMovement(newMovement, sheetsConfig.scriptUrl || '');
        newMovementsList = [syncResultMov.movement, ...newMovementsList];
      }

      if (exists) {
        newProductsList = products.map(p => (p.id === updatedProduct.id ? syncResult.product : p));
        showNotification(`Produto ${updatedProduct.id} atualizado ${syncResult.offline ? 'offline' : ''}!`);
      } else {
        newProductsList = [syncResult.product, ...products];
        showNotification(`Produto ${updatedProduct.id} cadastrado ${syncResult.offline ? 'offline' : ''}!`);
      }

      setProducts(newProductsList);
      setMovements(newMovementsList);

      const queue = await getSyncQueue();
      setSyncQueueCount(queue.length);
      setShowFormModal(false);
    } catch (err: any) {
      alert('Erro ao salvar produto: ' + err.message);
    }
  };

  // Open movement modal
  const handleOpenMovementModal = (product: Product, defaultType: 'Entrada' | 'Saída') => {
    setSelectedProductForMovement(product);
    setMovementDefaultType(defaultType);
    setShowMovementModal(true);
  };

  // Confirm Movement (+ Entrada or - Saída)
  const handleConfirmMovement = async (
    productId: string,
    tipo: 'Entrada' | 'Saída',
    quantidade: number,
    responsavel: string,
    observacao?: string,
    notaFiscal?: string
  ) => {
    try {
      const productIndex = products.findIndex(p => p.id === productId);
      if (productIndex === -1) {
        throw new Error('Produto não encontrado!');
      }

      const product = products[productIndex];
      let novaQtd = product.quantidade;

      if (tipo === 'Entrada') {
        novaQtd += quantidade;
      } else {
        if (quantidade > product.quantidade) {
          throw new Error(`Estoque insuficiente! Atual: ${product.quantidade}, Solicitado: ${quantidade}`);
        }
        novaQtd -= quantidade;
      }

      const updatedProduct: Product = {
        ...product,
        quantidade: novaQtd
      };

      const newMovement: Movement = {
        id: `MOV-${Date.now().toString().slice(-6)}`,
        produtoId: product.id,
        produtoNome: product.nome,
        tipo,
        quantidade,
        data: new Date().toISOString(),
        responsavel: responsavel.trim() || 'Almoxarife / Sistema',
        observacao,
        notaFiscal
      };

      // Salva localmente (IndexedDB) e enfileira para sincronização
      const syncResultProd = await syncSaveProduct(updatedProduct, sheetsConfig.scriptUrl || '');
      const syncResultMov = await syncSaveMovement(newMovement, sheetsConfig.scriptUrl || '');

      const newProductsList = products.map(p => (p.id === productId ? syncResultProd.product : p));
      setProducts(newProductsList);
      setMovements([syncResultMov.movement, ...movements]);

      const queue = await getSyncQueue();
      setSyncQueueCount(queue.length);
      setShowMovementModal(false);

      if (syncResultProd.offline || syncResultMov.offline) {
        showNotification(`${tipo} registrada offline! Sincronizará quando online.`);
      } else {
        showNotification(`${tipo} de ${quantidade} un. registrada no sistema!`);
      }
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
  const handleResetData = async () => {
    if (confirm('Deseja restaurar os dados demonstrativos do estoque PMI? (Atenção: Isso limpará toda a fila de sincronização pendente)')) {
      const initialProducts = loadProducts();
      const initialMovements = loadMovements();
      await resetLocalDatabase(initialProducts, initialMovements);
      setProducts(initialProducts);
      setMovements(initialMovements as any);
      setSyncQueueCount(0);
      showNotification('Dados restaurados para o padrão de exemplo.');
      setShowSheetsModal(false);
    }
  };

  // Import products JSON
  const handleImportData = async (importedProducts: Product[]) => {
    await resetLocalDatabase(importedProducts, []);
    setProducts(importedProducts);
    setMovements([]);
    setSyncQueueCount(0);
    showNotification(`${importedProducts.length} itens importados com sucesso!`);
    setShowSheetsModal(false);
  };

  // Baixa os dados diretamente do Google Sheets para o IndexedDB
  const handlePullData = async () => {
    if (!sheetsConfig.scriptUrl) return;
    const res = await pullDataFromGoogle(sheetsConfig.scriptUrl);
    if (res.success && res.products && res.movements) {
      setProducts(res.products);
      setMovements(res.movements as any);
      setSyncQueueCount(0);
    } else {
      throw new Error(res.error || 'Falha ao sincronizar dados com o Google Sheets.');
    }
  };

  // Força a sincronização dos itens pendentes da fila local
  const handleForceSync = async () => {
    if (!sheetsConfig.scriptUrl) return;
    const res = await processSyncQueue(sheetsConfig.scriptUrl);
    if (res.success) {
      const finalProds = await getLocalProducts();
      const finalMovs = await getLocalMovements();
      setProducts(finalProds);
      setMovements(finalMovs as any);
      setSyncQueueCount(0);
    } else {
      throw new Error(res.error || 'Falha ao forçar a sincronização.');
    }
  };

  const handleShareSheet = () => {
    const url = `https://docs.google.com/spreadsheets/d/${sheetsConfig.sheetId}/edit?usp=sharing`;
    if (navigator.share) {
      navigator.share({
        title: 'Planilha de Estoque PMI',
        text: 'Acesse a planilha de estoque ao vivo:',
        url: url
      }).catch(err => console.error(err));
    } else {
      navigator.clipboard.writeText(url);
      showNotification('Link da planilha copiado com sucesso!');
    }
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Bloqueador de pop-ups ativado! Permita a abertura para ver o relatório.');
      return;
    }
    
    const activeProds = products.filter(p => p.status !== 'Inativo');
    const rowsHtml = activeProds.map(p => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 8px; font-weight: bold; color: #1a73e8;">${p.id}</td>
        <td style="padding: 8px; font-weight: 600;">${p.nome}</td>
        <td style="padding: 8px; color: #475569;">${p.categoria}</td>
        <td style="padding: 8px; text-align: center; font-weight: bold;">${p.quantidade} un.</td>
        <td style="padding: 8px; color: #64748b;">${p.localizacao || '-'}</td>
        <td style="padding: 8px; color: #64748b;">${p.codigoBarras || '-'}</td>
      </tr>
    `).join('');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Estoque - PMI</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1a73e8; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #1e293b; }
            .meta { font-size: 11px; color: #64748b; text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #f1f5f9; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; }
            .footer { display: flex; justify-content: space-between; margin-top: 50px; font-size: 11px; color: #64748b; }
            .signature { width: 200px; border-top: 1px solid #94a3b8; text-align: center; padding-top: 5px; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: right; margin-bottom: 10px;">
            <button onclick="window.print()" style="padding: 6px 14px; background: #1a73e8; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; transition: 0.2s;">Imprimir Relatório</button>
          </div>
          <div class="header">
            <div>
              <div class="title">Estoque PMI - Relatório Geral</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Almoxarifado & Controle de Materiais</div>
            </div>
            <div class="meta">
              <div><b>Data de Emissão:</b> ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</div>
              <div><b>Total de Itens:</b> ${activeProds.length}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 10%;">ID</th>
                <th style="width: 35%;">Nome do Item</th>
                <th style="width: 15%;">Categoria</th>
                <th style="width: 12%; text-align: center;">Quantidade</th>
                <th style="width: 18%;">Localização</th>
                <th style="width: 10%;">Cód. Barras</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="footer">
            <div>Relatório gerado automaticamente pelo Sistema de Estoque PMI.</div>
            <div class="signature">Assinatura do Almoxarife</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const activeProducts = products.filter(p => p.status !== 'Inativo');
  const criticalProducts = activeProducts.filter(p => p.quantidade <= p.quantidadeMinima);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans pb-20 md:pb-8">
      {/* App Main Header */}
      <Header
        syncQueueCount={syncQueueCount}
        onOpenSheetsModal={() => setShowSheetsModal(true)}
      />

      {/* Connection and Sync Quick Bar */}
      <div className="bg-slate-200 border-b border-slate-300 px-4 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-600">
        <div className="flex items-center space-x-1.5">
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span className="text-red-600">Modo Offline (Alterações Locais)</span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {syncQueueCount > 0 ? (
            <button
              onClick={() => setShowSheetsModal(true)}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded px-2 py-0.5 flex items-center space-x-1 transition"
            >
              <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5" />
              <span>{syncQueueCount} alterações pendentes</span>
            </button>
          ) : (
            <span className="text-slate-500">Banco de Dados Sincronizado</span>
          )}
        </div>
      </div>

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
        <div className="fixed top-24 right-4 z-50 bg-[#1a73e8] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl border border-blue-400 flex items-center space-x-2 animate-bounce">
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

        {/* Tab 4: Configurações & Sincronização Google Sheets */}
        {activeTab === 'configuracoes' && (
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Painel de Controle e Relatórios */}
              <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-[#1a73e8]">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 uppercase">Central da Planilha</h2>
                    <span className="text-[10px] text-gray-500">Compartilhamento e Relatórios</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {/* Abrir no Sheets */}
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${sheetsConfig.sheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs transition shadow-2xs"
                  >
                    <span className="flex items-center space-x-2">
                      <ExternalLink className="w-4 h-4" />
                      <span>Abrir Google Sheets</span>
                    </span>
                    <span className="text-[9px] uppercase bg-white/25 text-white px-2 py-0.5 rounded-full font-bold">Planilha</span>
                  </a>

                  {/* Compartilhar Planilha */}
                  <button
                    onClick={handleShareSheet}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs"
                  >
                    <span className="flex items-center space-x-2">
                      <Share2 className="w-4 h-4" />
                      <span>Compartilhar Planilha</span>
                    </span>
                    <span className="text-[9px] uppercase bg-white/25 text-white px-2 py-0.5 rounded-full font-bold">Link</span>
                  </button>

                  {/* Gerar Relatório PDF */}
                  <button
                    onClick={handlePrintReport}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-2xs"
                  >
                    <span className="flex items-center space-x-2">
                      <Printer className="w-4 h-4" />
                      <span>Gerar Relatório (PDF)</span>
                    </span>
                    <span className="text-[9px] uppercase bg-white/25 text-white px-2 py-0.5 rounded-full font-bold">Imprimir</span>
                  </button>

                  {/* Sincronização */}
                  <button
                    onClick={() => setShowSheetsModal(true)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs transition"
                  >
                    <span className="flex items-center space-x-2">
                      <Wifi className="w-4 h-4 text-[#1a73e8]" />
                      <span>Configurações & Sync</span>
                    </span>
                    <span className="text-[9px] uppercase bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-bold">Ajustes</span>
                  </button>
                </div>
              </div>

              {/* Informações da Planilha */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-2xs">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Colunas Requeridas na Planilha Google</h3>
                <p className="text-xs text-gray-500">
                  Para o funcionamento completo das fotos no Google Drive e sincronização, certifique-se de que sua aba <b>Página1</b> e <b>MOVIMENTACOES</b> contenham os seguintes cabeçalhos:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-gray-700 bg-slate-50 p-3 rounded-xl border border-gray-200">
                  <div>
                    <span className="font-bold text-emerald-700 block mb-1">Aba 'Página1' (Produtos)</span>
                    <span className="font-mono text-gray-600 block leading-relaxed">
                      ID_PRODUTO, NOME, DESCRICAO, CATEGORIA, FOTO, QUANTIDADE, QUANTIDADE_MINIMA, LOCALIZACAO, DATA_CADASTRO, STATUS, CODIGO_BARRAS, FOTOS
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-blue-700 block mb-1">Aba 'MOVIMENTACOES' (Histórico)</span>
                    <span className="font-mono text-gray-600 block leading-relaxed">
                      ID_MOVIMENTACAO, ID_PRODUTO, TIPO, QUANTIDADE, DATA, RESPONSAVEL, OBSERVACAO, NOTA_FISCAL
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela de Itens Organizada e Categorizada */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-gray-900 uppercase">Itens da Planilha Sincronizados</h3>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  {products.length} itens no total
                </span>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhum item carregado da planilha ainda. Clique em "Configurações & Sync" para baixar.
                </div>
              ) : (
                <div className="space-y-6">
                  {Array.from(new Set(products.map(p => p.categoria || 'OUTROS'))).map(category => {
                    const categoryProducts = products.filter(p => (p.categoria || 'OUTROS') === category);
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center space-x-2 bg-slate-50 py-1 px-3 rounded-lg border border-slate-200">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{category}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                            {categoryProducts.length}
                          </span>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                            <thead className="bg-slate-100 font-bold text-slate-600">
                              <tr>
                                <th className="px-3 py-2">ID</th>
                                <th className="px-3 py-2">Foto</th>
                                <th className="px-3 py-2">Nome</th>
                                <th className="px-3 py-2">Descrição</th>
                                <th className="px-3 py-2">Localização</th>
                                <th className="px-3 py-2 text-center">Qtd.</th>
                                <th className="px-3 py-2 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {categoryProducts.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 transition">
                                  <td className="px-3 py-2 font-mono font-bold text-blue-600">{p.id}</td>
                                  <td className="px-3 py-2">
                                    <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                                      {p.foto ? (
                                        <img
                                          src={p.foto}
                                          alt={p.nome}
                                          className="w-full h-full object-cover cursor-pointer"
                                          onClick={() => handleViewImage(p.foto, p.nome)}
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80';
                                          }}
                                        />
                                      ) : (
                                        <span className="text-[9px] text-slate-400">Sem Foto</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 font-semibold text-slate-800">{p.nome}</td>
                                  <td className="px-3 py-2 text-slate-500 max-w-[200px] truncate" title={p.descricao}>{p.descricao || '-'}</td>
                                  <td className="px-3 py-2 text-slate-600 font-medium">{p.localizacao || '-'}</td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="font-bold text-slate-800">
                                      {p.quantidade} un.
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                      p.status !== 'Inativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                    }`}>
                                      {p.status !== 'Inativo' ? 'Ativo' : 'Inativo'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
          syncQueueCount={syncQueueCount}
          onUpdateConfig={(cfg) => {
            setSheetsConfig(cfg);
            saveSheetsConfig(cfg);
          }}
          onResetData={handleResetData}
          onImportData={handleImportData}
          onPullData={handlePullData}
          onForceSync={handleForceSync}
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
