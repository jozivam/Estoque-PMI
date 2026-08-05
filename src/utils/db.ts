import { Product, Movement } from '../types';

const DB_NAME = 'EstoquePMIDB';
const DB_VERSION = 1;

export interface SyncQueueItem {
  id: string; // Timestamp
  action: 'saveProduct' | 'saveMovement';
  data: any;
}

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Erro ao abrir o IndexedDB');
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;

      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('movements')) {
        db.createObjectStore('movements', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    };
  });
};

// --- Operações de Produtos ---

export const getLocalProducts = async (): Promise<Product[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('products', 'readonly');
    const store = transaction.objectStore('products');
    const request = store.getAll();

    request.onsuccess = () => {
      // Ordenar por ordem alfabética de nome ou dataCadastro decrescente
      const sorted = (request.result as Product[]).sort((a, b) => 
        b.dataCadastro.localeCompare(a.dataCadastro)
      );
      resolve(sorted);
    };

    request.onerror = () => reject(request.error);
  });
};

export const saveLocalProduct = async (product: Product): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('products', 'readwrite');
    const store = transaction.objectStore('products');
    const request = store.put(product);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const saveLocalProductsBatch = async (products: Product[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('products', 'readwrite');
    const store = transaction.objectStore('products');

    products.forEach(product => {
      store.put(product);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// --- Operações de Movimentações ---

export const getLocalMovements = async (): Promise<Movement[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('movements', 'readonly');
    const store = transaction.objectStore('movements');
    const request = store.getAll();

    request.onsuccess = () => {
      // Ordenar decrescente pela data da movimentação
      const sorted = (request.result as Movement[]).sort((a, b) => 
        b.data.localeCompare(a.data)
      );
      resolve(sorted);
    };

    request.onerror = () => reject(request.error);
  });
};

export const saveLocalMovement = async (movement: Movement): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('movements', 'readwrite');
    const store = transaction.objectStore('movements');
    const request = store.put(movement);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const saveLocalMovementsBatch = async (movements: Movement[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('movements', 'readwrite');
    const store = transaction.objectStore('movements');

    movements.forEach(movement => {
      store.put(movement);
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// --- Operações da Fila de Sincronização (Sync Queue) ---

export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('syncQueue', 'readonly');
    const store = transaction.objectStore('syncQueue');
    const request = store.getAll();

    request.onsuccess = () => {
      // Retorna em ordem cronológica (pelo timestamp ID)
      const sorted = (request.result as SyncQueueItem[]).sort((a, b) => 
        a.id.localeCompare(b.id)
      );
      resolve(sorted);
    };

    request.onerror = () => reject(request.error);
  });
};

export const addToSyncQueue = async (action: 'saveProduct' | 'saveMovement', data: any): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('syncQueue', 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    const queueItem: SyncQueueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action,
      data
    };

    const request = store.put(queueItem);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const removeFromSyncQueue = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('syncQueue', 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// --- Restaurar Base e Dados Iniciais ---

export const resetLocalDatabase = async (initialProducts: Product[], initialMovements: Product[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['products', 'movements', 'syncQueue'], 'readwrite');
    
    transaction.objectStore('products').clear();
    transaction.objectStore('movements').clear();
    transaction.objectStore('syncQueue').clear();

    const prodStore = transaction.objectStore('products');
    initialProducts.forEach(p => prodStore.put(p));

    const movStore = transaction.objectStore('movements');
    initialMovements.forEach(m => movStore.put(m));

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};
