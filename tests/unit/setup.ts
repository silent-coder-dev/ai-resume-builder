import { IDBFactory } from 'fake-indexeddb';
import { beforeEach } from 'vitest';
import { IndexedDbBackend } from '@/lib/storage/backend';
import { setStorageBackend } from '@/lib/storage/resumeRepository';

// A tiny localStorage stand-in so code that uses `window.localStorage` runs in Node.
class MemoryStorage implements Storage {
  private items = new Map<string, string>();
  get length() {
    return this.items.size;
  }
  clear() {
    this.items.clear();
  }
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
  setItem(key: string, value: string) {
    this.items.set(key, String(value));
  }
}

const memoryStorage = new MemoryStorage();
Object.defineProperty(globalThis, 'window', { value: { localStorage: memoryStorage }, configurable: true });

// Every test starts with an empty browser database and empty localStorage.
beforeEach(async () => {
  memoryStorage.clear();
  setStorageBackend(await IndexedDbBackend.open(new IDBFactory()));
});

export { memoryStorage };
