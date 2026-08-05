import { Product, Movement } from '../types';
import { 
  getSyncQueue, 
  removeFromSyncQueue, 
  saveLocalProduct, 
  saveLocalMovement,
  saveLocalProductsBatch,
  saveLocalMovementsBatch,
  addToSyncQueue
} from './db';

// Verifica se há conexão com a internet
export const isOnline = (): boolean => {
  return navigator.onLine;
};

interface SyncResponse {
  success: boolean;
  data?: {
    products?: Product[];
    movements?: Movement[];
  };
  error?: string;
}

/**
 * Envia itens pendentes na fila de sincronização para o Google Sheets/Drive
 */
export const processSyncQueue = async (apiUrl: string): Promise<{ success: boolean; syncedCount: number; error?: string }> => {
  if (!isOnline()) {
    return { success: false, syncedCount: 0, error: 'Sem conexão com a internet' };
  }

  if (!apiUrl || !apiUrl.startsWith('http')) {
    return { success: false, syncedCount: 0, error: 'URL do Google Apps Script não configurada' };
  }

  const queue = await getSyncQueue();
  if (queue.length === 0) {
    return { success: true, syncedCount: 0 };
  }

  // Separar em lotes para enviar
  const productsToSync: Product[] = [];
  const movementsToSync: Movement[] = [];
  const queueItemIds: string[] = [];

  queue.forEach(item => {
    if (item.action === 'saveProduct') {
      productsToSync.push(item.data);
    } else if (item.action === 'saveMovement') {
      movementsToSync.push(item.data);
    }
    queueItemIds.push(item.id);
  });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Usamos text/plain para evitar problemas de pré-vôo CORS rígidos do GAS
      },
      body: JSON.stringify({
        action: 'syncBatch',
        products: productsToSync,
        movements: movementsToSync
      })
    });

    const result: SyncResponse = await response.json();

    if (result.success && result.data) {
      // 1. Atualiza no IndexedDB local com os dados finais retornados (URLs do Google Drive geradas)
      if (result.data.products && result.data.products.length > 0) {
        await saveLocalProductsBatch(result.data.products);
      }
      if (result.data.movements && result.data.movements.length > 0) {
        await saveLocalMovementsBatch(result.data.movements);
      }

      // 2. Remove os itens processados da fila de sincronização
      for (const id of queueItemIds) {
        await removeFromSyncQueue(id);
      }

      return { success: true, syncedCount: queue.length };
    } else {
      return { success: false, syncedCount: 0, error: result.error || 'Erro desconhecido na sincronização' };
    }
  } catch (err: any) {
    console.error('Falha ao processar fila de sincronização:', err);
    return { success: false, syncedCount: 0, error: err.message || 'Erro de conexão com o servidor' };
  }
};

/**
 * Busca todos os dados atuais direto da Planilha do Google Sheets para atualizar o IndexedDB
 */
export const pullDataFromGoogle = async (apiUrl: string): Promise<{ success: boolean; products?: Product[]; movements?: Movement[]; error?: string }> => {
  if (!isOnline()) {
    return { success: false, error: 'Sem conexão com a internet para baixar os dados' };
  }

  if (!apiUrl || !apiUrl.startsWith('http')) {
    return { success: false, error: 'URL da planilha não configurada ou inválida' };
  }

  try {
    const url = `${apiUrl}?action=getData`;
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow'
    });

    const result = await response.json();

    if (result && !result.error) {
      const { products, movements } = result;
      
      // Salva em lote localmente no banco offline
      if (products) await saveLocalProductsBatch(products);
      if (movements) await saveLocalMovementsBatch(movements);

      return { success: true, products, movements };
    } else {
      return { success: false, error: result.error || 'Planilha não retornou dados válidos' };
    }
  } catch (err: any) {
    console.error('Erro ao baixar dados do Google Sheets:', err);
    return { success: false, error: err.message || 'Falha de comunicação de rede' };
  }
};

/**
 * Salva produto offline no DB e adiciona à fila de sincronização
 */
export const syncSaveProduct = async (product: Product, apiUrl: string): Promise<{ success: boolean; product: Product; offline: boolean }> => {
  // Salva no DB local imediatamente
  const localProd = { ...product, syncPending: true };
  await saveLocalProduct(localProd);

  // Adiciona à fila de sincronização
  await addToSyncQueue('saveProduct', product);

  if (isOnline() && apiUrl && apiUrl.startsWith('http')) {
    // Processa a fila em segundo plano sem travar a interface
    processSyncQueue(apiUrl).then((res) => {
      if (res.success && res.syncedCount > 0) {
        window.dispatchEvent(new CustomEvent('sync-completed'));
      }
    }).catch(err => console.error('Erro na sincronização em segundo plano:', err));
    return { success: true, product, offline: false };
  }

  return { success: true, product: localProd, offline: true };
};

export const syncSaveMovement = async (movement: Movement, apiUrl: string): Promise<{ success: boolean; movement: Movement; offline: boolean }> => {
  // Salva no DB local
  await saveLocalMovement(movement);

  // Adiciona à fila de sincronização
  await addToSyncQueue('saveMovement', movement);

  if (isOnline() && apiUrl && apiUrl.startsWith('http')) {
    // Processa a fila em segundo plano sem travar a interface
    processSyncQueue(apiUrl).then((res) => {
      if (res.success && res.syncedCount > 0) {
        window.dispatchEvent(new CustomEvent('sync-completed'));
      }
    }).catch(err => console.error('Erro na sincronização em segundo plano:', err));
    return { success: true, movement, offline: false };
  }

  return { success: true, movement, offline: true };
};
