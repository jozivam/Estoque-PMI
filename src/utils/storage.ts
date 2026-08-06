import { Product, Movement, GoogleSheetsConfig } from '../types';
import { INITIAL_PRODUCTS, INITIAL_MOVEMENTS } from '../data/mockData';

const STORAGE_KEYS = {
  PRODUCTS: 'pmi_estoque_produtos_v2',
  MOVEMENTS: 'pmi_estoque_movimentacoes_v2',
  CONFIG: 'pmi_estoque_config_v2'
};

export const loadProducts = (): Product[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    return INITIAL_PRODUCTS;
  }
};

export const saveProducts = (products: Product[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (error) {
    console.error('Erro ao salvar produtos:', error);
  }
};

export const loadMovements = (): Movement[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
      return INITIAL_MOVEMENTS;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar movimentações:', error);
    return INITIAL_MOVEMENTS;
  }
};

export const saveMovements = (movements: Movement[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  } catch (error) {
    console.error('Erro ao salvar movimentações:', error);
  }
};

export const generateNextProductId = (existingProducts: Product[]): string => {
  let maxNum = 0;
  existingProducts.forEach(p => {
    const match = p.id.match(/^PMI-(\d+)$/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  const nextNum = maxNum + 1;
  return `PMI-${String(nextNum).padStart(3, '0')}`;
};

export const recordStockMovement = (
  productId: string,
  tipo: 'Entrada' | 'Saída',
  quantidade: number,
  responsavel: string,
  observacao?: string,
  notaFiscal?: string
): { updatedProducts: Product[]; newMovement: Movement } => {
  const products = loadProducts();
  const movements = loadMovements();

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

  // Update product stock
  products[productIndex] = {
    ...product,
    quantidade: novaQtd
  };

  saveProducts(products);

  // Record movement log
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

  const updatedMovements = [newMovement, ...movements];
  saveMovements(updatedMovements);

  return { updatedProducts: products, newMovement };
};

export const loadSheetsConfig = (): GoogleSheetsConfig => {
  const defaults = {
    sheetId: '1AQog5QCHbAf138bIt97eCx_nMIoJ7Pzha2MOU4cBD-4',
    scriptUrl: 'https://script.google.com/macros/s/AKfycbxNmxk_64H1NdcgjGd1k7BFD3RptNIW7Pui0y2H8HbPQcG7iYgicttqx9uca1mhRc18/exec',
    autoSync: true
  };
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        sheetId: parsed.sheetId && parsed.sheetId.trim() !== '' ? parsed.sheetId : defaults.sheetId,
        scriptUrl: parsed.scriptUrl && parsed.scriptUrl.trim() !== '' ? parsed.scriptUrl : defaults.scriptUrl,
        autoSync: parsed.autoSync !== undefined ? parsed.autoSync : defaults.autoSync,
        lastSynced: parsed.lastSynced
      };
    }
  } catch (e) {
    console.error('Erro ao carregar configuração do Google Sheets:', e);
  }
  return defaults;
};

export const saveSheetsConfig = (config: GoogleSheetsConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Erro ao salvar configuração:', e);
  }
};

export const resetToSampleData = (): { products: Product[]; movements: Movement[] } => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
  return { products: INITIAL_PRODUCTS, movements: INITIAL_MOVEMENTS };
};
