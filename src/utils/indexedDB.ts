export interface StoredTrack {
  id: string;
  blob: Blob;
  name: string;
  type: string;
}

export interface StoredOfflineSet {
  id: string;
  name: string;
  createdAt: number;
  tracks: any[]; // We will store the Track metadata objects here
}

const DB_NAME = 'TecnoBitCrate';
const STORE_NAME = 'tracks';
const SETS_STORE_NAME = 'offline_sets';
const DB_VERSION = 2; // Bumped version for new store

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETS_STORE_NAME)) {
        db.createObjectStore(SETS_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveTrackBlob = async (track: StoredTrack): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(track);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getTrackBlob = async (id: string): Promise<Blob | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const result = request.result as StoredTrack | undefined;
      resolve(result ? result.blob : null);
    };
  });
};

export const deleteTrackBlob = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getAllStoredTracks = async (): Promise<StoredTrack[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

// --- Offline Sets Commands ---

export const saveOfflineSet = async (set: StoredOfflineSet): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SETS_STORE_NAME);
    const request = store.put(set);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getAllOfflineSets = async (): Promise<StoredOfflineSet[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(SETS_STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Return sorted by creation date (newest first)
      const sets = (request.result as StoredOfflineSet[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(sets);
    };
  });
};

export const deleteOfflineSet = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETS_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(SETS_STORE_NAME);
      const request = store.delete(id);
  
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
};
