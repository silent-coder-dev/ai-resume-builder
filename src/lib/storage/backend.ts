// Low-level key/value storage used by the resume repository.
// IndexedDB in normal browsers; an in-memory fallback when the browser
// blocks storage (some private modes). The fallback is clearly reported
// to the user because it does not survive a refresh.

export type StoreName = 'resumes' | 'versions' | 'meta';

export interface StorageBackend {
  readonly kind: 'indexeddb' | 'memory';
  get<T>(store: StoreName, key: string): Promise<T | undefined>;
  getAll<T>(store: StoreName): Promise<T[]>;
  getAllByIndex<T>(store: StoreName, index: string, value: string): Promise<T[]>;
  put<T>(store: StoreName, value: T): Promise<void>;
  delete(store: StoreName, key: string): Promise<void>;
  clear(store: StoreName): Promise<void>;
  // Reads the current value and writes the new one in a single atomic step.
  // `check` may throw to cancel the write (used for conflict detection).
  compareAndPut<T>(store: StoreName, key: string, value: T, check: (existing: T | undefined) => void): Promise<void>;
}

const DB_NAME = 'ai-resume-studio';
const DB_VERSION = 1;

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Storage request failed.'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('Storage write was cancelled.'));
    transaction.onerror = () => reject(transaction.error ?? new Error('Storage write failed.'));
  });
}

export class IndexedDbBackend implements StorageBackend {
  readonly kind = 'indexeddb' as const;

  private constructor(private readonly db: IDBDatabase) {}

  static open(factory: IDBFactory = indexedDB): Promise<IndexedDbBackend> {
    return new Promise((resolve, reject) => {
      let request: IDBOpenDBRequest;
      try {
        request = factory.open(DB_NAME, DB_VERSION);
      } catch (error) {
        reject(error);
        return;
      }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('resumes')) db.createObjectStore('resumes', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('versions')) {
          const versions = db.createObjectStore('versions', { keyPath: 'id' });
          versions.createIndex('byResume', 'resumeId', { unique: false });
        }
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      };
      request.onsuccess = () => {
        const db = request.result;
        // Another tab upgrading the database: close so it is not blocked.
        db.onversionchange = () => db.close();
        resolve(new IndexedDbBackend(db));
      };
      request.onerror = () => reject(request.error ?? new Error('Could not open browser storage.'));
      request.onblocked = () => reject(new Error('Browser storage is blocked by another open tab.'));
    });
  }

  async get<T>(store: StoreName, key: string): Promise<T | undefined> {
    const tx = this.db.transaction(store, 'readonly');
    return (await requestToPromise(tx.objectStore(store).get(key))) as T | undefined;
  }

  async getAll<T>(store: StoreName): Promise<T[]> {
    const tx = this.db.transaction(store, 'readonly');
    return (await requestToPromise(tx.objectStore(store).getAll())) as T[];
  }

  async getAllByIndex<T>(store: StoreName, index: string, value: string): Promise<T[]> {
    const tx = this.db.transaction(store, 'readonly');
    return (await requestToPromise(tx.objectStore(store).index(index).getAll(value))) as T[];
  }

  async put<T>(store: StoreName, value: T): Promise<void> {
    const tx = this.db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    await transactionDone(tx);
  }

  async delete(store: StoreName, key: string): Promise<void> {
    const tx = this.db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    await transactionDone(tx);
  }

  async clear(store: StoreName): Promise<void> {
    const tx = this.db.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    await transactionDone(tx);
  }

  compareAndPut<T>(store: StoreName, key: string, value: T, check: (existing: T | undefined) => void): Promise<void> {
    const tx = this.db.transaction(store, 'readwrite');
    const objectStore = tx.objectStore(store);
    let checkError: unknown = null;
    const done = transactionDone(tx).catch((error) => {
      throw checkError ?? error;
    });
    const getRequest = objectStore.get(key);
    getRequest.onsuccess = () => {
      try {
        check(getRequest.result as T | undefined);
        objectStore.put(value);
      } catch (error) {
        checkError = error;
        tx.abort();
      }
    };
    return done;
  }
}

export class MemoryBackend implements StorageBackend {
  readonly kind = 'memory' as const;
  private readonly stores: Record<StoreName, Map<string, unknown>> = {
    resumes: new Map(),
    versions: new Map(),
    meta: new Map(),
  };

  private keyOf(store: StoreName, value: unknown): string {
    const record = value as Record<string, unknown>;
    return String(store === 'meta' ? record.key : record.id);
  }

  async get<T>(store: StoreName, key: string) {
    const value = this.stores[store].get(key);
    return value === undefined ? undefined : (structuredClone(value) as T);
  }

  async getAll<T>(store: StoreName) {
    return [...this.stores[store].values()].map((value) => structuredClone(value) as T);
  }

  async getAllByIndex<T>(store: StoreName, index: string, value: string) {
    const field = index === 'byResume' ? 'resumeId' : index;
    return (await this.getAll<Record<string, unknown>>(store)).filter((item) => item[field] === value) as T[];
  }

  async put<T>(store: StoreName, value: T) {
    this.stores[store].set(this.keyOf(store, value), structuredClone(value));
  }

  async delete(store: StoreName, key: string) {
    this.stores[store].delete(key);
  }

  async clear(store: StoreName) {
    this.stores[store].clear();
  }

  async compareAndPut<T>(store: StoreName, key: string, value: T, check: (existing: T | undefined) => void) {
    check(await this.get<T>(store, key));
    await this.put(store, value);
  }
}
