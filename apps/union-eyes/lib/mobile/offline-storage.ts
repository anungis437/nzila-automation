/**
 * Offline Storage Library
 * 
 * Provides IndexedDB wrapper for offline-first mobile functionality
 * Supports:
 * - Local data caching
 * - Offline CRUD operations
 * - Sync queue management
 * - Conflict resolution
 * - Storage quota management
 */

import { logger } from '@/lib/logger';

// Database configuration
const DB_NAME = 'union-eyes-offline';
const DB_VERSION = 1;

// Object store names
export const STORES = {
  CLAIMS: 'claims',
  MEMBERS: 'members',
  MESSAGES: 'messages',
  DOCUMENTS: 'documents',
  SYNC_QUEUE: 'syncQueue',
  CACHE: 'cache',
} as const;

export type StoreName = typeof STORES[keyof typeof STORES];

// Database instance
let db: IDBDatabase | null = null;

/**
 * Initialize the offline database
 */
export async function initOfflineDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      logger.error('Failed to open offline DB', { error: request.error });
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      logger.info('Offline DB initialized');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      createObjectStores(database);
    };
  });
}

/**
 * Create object stores for the database
 */
function createObjectStores(database: IDBDatabase): void {
  // Claims store
  if (!database.objectStoreNames.contains(STORES.CLAIMS)) {
    const claimsStore = database.createObjectStore(STORES.CLAIMS, { keyPath: 'id' });
    claimsStore.createIndex('status', 'status', { unique: false });
    claimsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
    claimsStore.createIndex('synced', 'synced', { unique: false });
  }

  // Members store
  if (!database.objectStoreNames.contains(STORES.MEMBERS)) {
    const membersStore = database.createObjectStore(STORES.MEMBERS, { keyPath: 'id' });
    membersStore.createIndex('organizationId', 'organizationId', { unique: false });
    membersStore.createIndex('synced', 'synced', { unique: false });
  }

  // Messages store
  if (!database.objectStoreNames.contains(STORES.MESSAGES)) {
    const messagesStore = database.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
    messagesStore.createIndex('conversationId', 'conversationId', { unique: false });
    messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
    messagesStore.createIndex('synced', 'synced', { unique: false });
  }

  // Documents store
  if (!database.objectStoreNames.contains(STORES.DOCUMENTS)) {
    const documentsStore = database.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' });
    documentsStore.createIndex('type', 'type', { unique: false });
    documentsStore.createIndex('synced', 'synced', { unique: false });
  }

  // Sync queue store
  if (!database.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
    const syncStore = database.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
    syncStore.createIndex('type', 'type', { unique: false });
    syncStore.createIndex('status', 'status', { unique: false });
    syncStore.createIndex('createdAt', 'createdAt', { unique: false });
  }

  // Generic cache store
  if (!database.objectStoreNames.contains(STORES.CACHE)) {
    const cacheStore = database.createObjectStore(STORES.CACHE, { keyPath: 'key' });
    cacheStore.createIndex('expiry', 'expiry', { unique: false });
  }
}

/**
 * Generic CRUD operations
 */
export const offlineStorage = {
  /**
   * Get a single item from a store
   */
  async get<T>(storeName: StoreName, key: string): Promise<T | null> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get all items from a store
   */
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get items by index
   */
  async getByIndex<T>(
    storeName: StoreName, 
    indexName: string, 
    value: IDBValidKey
  ): Promise<T[]> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Put an item into a store
   */
  async put<T extends { id: string }>(storeName: StoreName, item: T): Promise<string> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(item.id);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Delete an item from a store
   */
  async delete(storeName: StoreName, key: string): Promise<void> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Clear all items from a store
   */
  async clear(storeName: StoreName): Promise<void> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Check if store contains unsynced items
   */
  async hasUnsyncedItems(storeName: StoreName): Promise<boolean> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('synced');
      const request = index.getAll(0); // 0 = false (not synced)

      request.onsuccess = () => resolve(request.result.length > 0);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get unsynced items count
   */
  async getUnsyncedCount(storeName: StoreName): Promise<number> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('synced');
      const request = index.getAllKeys(0);

      request.onsuccess = () => resolve(request.result?.length || 0);
      request.onerror = () => reject(request.error);
    });
  },
};

/**
 * Sync queue management
 */
export const syncQueue = {
  /**
   * Add operation to sync queue
   */
  async add(operation: SyncOperation): Promise<number> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      
      const queuedOperation: QueuedOperation = {
        ...operation,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        lastAttemptAt: null,
      };

      const request = store.add(queuedOperation);

      request.onsuccess = () => {
        logger.info('Operation queued for sync', { type: operation.type });
        resolve(request.result as number);
      };
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get pending sync operations
   */
  async getPending(): Promise<QueuedOperation[]> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORES.SYNC_QUEUE, 'readonly');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Mark operation as completed
   */
  async complete(id: number): Promise<void> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Mark operation as failed
   */
  async fail(id: number, error: string): Promise<void> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.status = 'failed';
          operation.error = error;
          operation.retryCount += 1;
          operation.lastAttemptAt = new Date().toISOString();
          
          const putRequest = store.put(operation);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  },
};

/**
 * Generic cache with TTL support
 */
export const offlineCache = {
  /**
   * Set cache item with TTL
   */
  async set<T>(key: string, value: T, ttlMinutes: number = 60): Promise<void> {
    const database = await initOfflineDB();
    const expiry = Date.now() + ttlMinutes * 60 * 1000;

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORES.CACHE, 'readwrite');
      const store = transaction.objectStore(STORES.CACHE);
      const request = store.put({ key, value, expiry });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Get cache item if not expired
   */
  async get<T>(key: string): Promise<T | null> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORES.CACHE, 'readonly');
      const store = transaction.objectStore(STORES.CACHE);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        if (result.expiry < Date.now()) {
          // Expired - delete it
          store.delete(key);
          resolve(null);
          return;
        }

        resolve(result.value);
      };
      request.onerror = () => reject(request.error);
    });
  },

  /**
   * Clear expired cache entries
   */
  async clearExpired(): Promise<void> {
    const database = await initOfflineDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORES.CACHE, 'readwrite');
      const store = transaction.objectStore(STORES.CACHE);
      const index = store.index('expiry');
      const now = Date.now();

      const request = index.openCursor(IDBKeyRange.upperBound(now));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  },
};

/**
 * Storage quota management
 */
export async function getStorageQuota(): Promise<StorageQuota> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      available: estimate.quota || 0,
      percentage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100,
    };
  }

  return { used: 0, available: 0, percentage: 0 };
}

/**
 * Clear all offline data
 */
export async function clearAllOfflineData(): Promise<void> {
  const database = await initOfflineDB();
  const storeNames = Object.values(STORES);

  for (const storeName of storeNames) {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  logger.info('All offline data cleared');
}

// Types
export interface SyncOperation {
  type: 'create' | 'update' | 'delete';
  entity: 'claim' | 'member' | 'message' | 'document';
  data: Record<string, unknown>;
  entityId: string;
}

export interface QueuedOperation extends SyncOperation {
  id?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  createdAt: string;
  lastAttemptAt: string | null;
  error?: string;
}

export interface StorageQuota {
  used: number;
  available: number;
  percentage: number;
}
