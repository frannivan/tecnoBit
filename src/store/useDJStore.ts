import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAllStoredTracks, deleteTrackBlob, getAllOfflineSets, saveOfflineSet as saveSetToDB, deleteOfflineSet as deleteSetFromDB, saveTrackBlob } from '../utils/indexedDB';
import type { StoredOfflineSet } from '../utils/indexedDB';
import { supabase } from '../utils/supabase';
import toast from 'react-hot-toast';

export interface Track {
  id: string;
  title: string;
  artist: string;
  timestamp: number;
  audioUrl?: string; // Optional audio source
  // Metadata fields
  artwork?: string; // Base64 or URL
  album?: string;
  year?: string;
  duration?: number; // In seconds
  isShared?: boolean; // Flag for shared tracks
  playlistItemId?: string; // Unique ID for specific entry in playlist
}

interface DJState {
  playlist: Track[];
  history: Track[];
  offlineSets: StoredOfflineSet[]; // Array of saved sets
  sharedCrate: Track[]; // Global files from Supabase
  currentPlaylistIndex: number; // Track which song is playing in the playlist
  activeTrackId: string | null; // ID of the currently playing standalone track
  isLoadingShared: boolean;
  
  // Actions
  addToPlaylist: (track: Track) => boolean;
  removeFromPlaylist: (id: string) => void;
  addToHistory: (track: Track) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  reorderPlaylist: (newOrder: Track[]) => void;
  playNextTrack: () => Track | null; // Returns next track or null if none
  setCurrentPlaylistIndex: (index: number) => void;
  setActiveTrackId: (id: string | null) => void;
  // Local Crate / Offline Sets Actions
  initOfflineSets: () => Promise<void>;
  saveCurrentPlaylistAsSet: (name: string) => Promise<void>;
  loadOfflineSet: (setId: string) => Promise<void>;
  deleteOfflineSet: (setId: string) => Promise<void>;
  clearLocalCache: () => Promise<void>;

  // Shared Crate Actions
  fetchSharedCrate: () => Promise<void>;
  uploadToSharedCrate: (file: File, metadata: Partial<Track>) => Promise<void>;
  uploadMultipleToSharedCrate: (items: { file: File, metadata: Partial<Track> }[], onProgress?: (current: number, total: number) => void) => Promise<void>;
  // Legacy action for individual saving (used internally for auto-cache)
  saveTrackToLocal: (track: Track) => Promise<void>;
}

export const useDJStore = create<DJState>()(
  persist(
    (set, get) => ({
      playlist: [],
      offlineSets: [],
      sharedCrate: [],
      currentPlaylistIndex: -1,
      activeTrackId: null,
      isLoadingShared: false,
      history: [],

      setActiveTrackId: (id) => set({ activeTrackId: id }),

      addToPlaylist: (track) => {
        const state = get();
        const playlist = state.playlist;
        const currentIndex = state.currentPlaylistIndex;
        
        // Find if this track exists in the ACTIVE part of the playlist
        // (from currentIndex to the end)
        // If currentIndex is -1 (nothing playing), we check the entire playlist.
        const checkFromIndex = Math.max(0, currentIndex);
        const existsInFuture = playlist.some((t, idx) => idx >= checkFromIndex && t.id === track.id);

        if (existsInFuture) {
          return false;
        }

        // Generate a unique ID for this specific playlist entry
        const playlistItemId = crypto.randomUUID();
        const newTrack = { ...track, playlistItemId };
        
        set({
          playlist: [...playlist, newTrack]
        });

        // Auto-cache background task
        if (newTrack.audioUrl) {
            get().saveTrackToLocal(newTrack).catch(e => console.warn("Auto-cache failed:", e));
        }

        return true;
      },

      removeFromPlaylist: (id) => set((state) => ({
        playlist: state.playlist.filter(t => 
          t.playlistItemId ? t.playlistItemId !== id : t.id !== id
        )
      })),

      addToHistory: (track) => set((state) => {
        // Prevent any duplicates in history
        if (state.history.some(t => t.id === track.id)) return state;
        return {
          history: [track, ...state.history].slice(0, 50) // Limit history to 50
        };
      }),

      removeFromHistory: (id) => set((state) => ({
        history: state.history.filter(t => t.id !== id)
      })),

      clearHistory: () => set({ history: [] }),

      reorderPlaylist: (newOrder) => set({ playlist: newOrder }),

      setCurrentPlaylistIndex: (index) => set({ currentPlaylistIndex: index }),
      
      playNextTrack: () => {
        const state = get();
        const nextIndex = state.currentPlaylistIndex + 1;
        
        if (nextIndex < state.playlist.length) {
          set({ currentPlaylistIndex: nextIndex });
          return state.playlist[nextIndex];
        }
        
        // End of playlist, reset
        set({ currentPlaylistIndex: -1 });
        return null;
      },

      initOfflineSets: async () => {
        try {
          const sets = await getAllOfflineSets();
          set({ offlineSets: sets });
        } catch (e) {
          console.error("Failed to load offline sets:", e);
        }
      },

      saveCurrentPlaylistAsSet: async (name: string) => {
          const playlist = get().playlist;
          if (playlist.length === 0) {
              toast.error("La playlist está vacía");
              return;
          }

          toast.loading("Guardando set y descargando audio...", { id: 'saveSet' });
          let savedCount = 0;

          // 1. Ensure all tracks are cached
          for (const track of playlist) {
             if (track.audioUrl) {
                 try {
                     await get().saveTrackToLocal(track);
                     savedCount++;
                 } catch(e) {
                     console.error("Error offline caching track", track.title);
                 }
             }
          }

          // 2. Create the Set object (strip unique playlistItemId to avoid conflicts on reload)
          const setTracks = playlist.map(t => {
              const { playlistItemId, ...cleanTrack } = t;
              return cleanTrack;
          });

          const newSet: StoredOfflineSet = {
              id: crypto.randomUUID(),
              name: name || `Set ${new Date().toLocaleDateString()}`,
              createdAt: Date.now(),
              tracks: setTracks
          };

          // 3. Save to DB and Update State
          await saveSetToDB(newSet);
          await get().initOfflineSets();
          
          toast.success(`Set "${newSet.name}" guardado. ${savedCount} canciones cacheadas.`, { id: 'saveSet' });
      },

      loadOfflineSet: async (setId: string) => {
          const sets = get().offlineSets;
          const targetSet = sets.find(s => s.id === setId);
          
          if (!targetSet) {
              toast.error("Set no encontrado");
              return;
          }

          // Generate NEW unique IDs for the playlist instance
          const loadedPlaylist = targetSet.tracks.map(t => ({
              ...t,
              playlistItemId: crypto.randomUUID()
          }));

          set({
              playlist: loadedPlaylist,
              currentPlaylistIndex: -1, // Reset player to start
              activeTrackId: null
          });

          toast.success(`Set "${targetSet.name}" cargado`);
      },

      deleteOfflineSet: async (setId: string) => {
          try {
              await deleteSetFromDB(setId);
              await get().initOfflineSets();
              toast.success("Set eliminado");
          } catch(e) {
              console.error("Error deleting set", e);
              toast.error("Error al eliminar el set");
          }
      },

      fetchSharedCrate: async () => {
        set({ isLoadingShared: true });
        try {
            const { data, error } = await supabase
                .from('tracks')
                .select('*')
                .order('timestamp', { ascending: false });

            if (error) throw error;

            const tracks: Track[] = (data || []).map(t => ({
                id: t.id,
                title: t.title,
                artist: t.artist || 'Unknown',
                timestamp: t.timestamp,
                audioUrl: t.audio_url,
                artwork: t.artwork_url, // Map artwork_url from DB
                duration: t.duration || 0,
                isShared: true
            }));

            set({ sharedCrate: tracks });
        } catch (e) {
            console.error("Failed to fetch shared crate:", e);
        } finally {
            set({ isLoadingShared: false });
        }
      },

      saveTrackToLocal: async (track) => {
        // Fallback for missing audioUrl (e.g. some system tracks)
        if (!track.audioUrl || !track.audioUrl.startsWith('http')) return; 
        
        try {
          // Check if already cached
          const storedTracks = await getAllStoredTracks();
          if (storedTracks.some(t => t.id === track.id)) {
              return; // Already cached
          }

          const response = await fetch(track.audioUrl);
          const blob = await response.blob();
          
          await saveTrackBlob({
            id: track.id,
            blob,
            name: track.title,
            type: blob.type
          });
          
        } catch (e) {
          console.error(`Failed to save track ${track.title} for offline:`, e);
          throw e;
        }
      },


      uploadToSharedCrate: async (file, metadata) => {
        await get().uploadMultipleToSharedCrate([{ file, metadata }]);
      },

      uploadMultipleToSharedCrate: async (items, onProgress) => {
        const fetchSharedCrate = get().fetchSharedCrate;
        const currentCrateInDB = get().sharedCrate;
        
        console.log(`Batch Upload: Processing ${items.length} items...`);

        // 1. Filter out duplicates (against DB AND within the batch)
        const toUpload: { file: File, metadata: Partial<Track> }[] = [];
        const seenInBatch = new Set<string>();

        for (const item of items) {
            const normalizedTitle = (item.metadata.title || item.file.name.replace(/\.[^/.]+$/, "")).trim().toLowerCase();
            const normalizedArtist = (item.metadata.artist || "Unknown").trim().toLowerCase();
            const key = `${normalizedTitle}|${normalizedArtist}`;

            // Check against DB
            const existsInDB = currentCrateInDB.some(t => 
                t.title.trim().toLowerCase() === normalizedTitle && 
                t.artist.trim().toLowerCase() === normalizedArtist
            );

            if (existsInDB || seenInBatch.has(key)) {
                console.warn(`Skipping duplicate: ${normalizedTitle} - ${normalizedArtist}`);
                toast.error(`"${item.file.name}" ya existe en Shared Crate`, { icon: 'ℹ️' });
                continue;
            }

            seenInBatch.add(key);
            toUpload.push(item);
        }

        if (toUpload.length < items.length) {
            console.log(`Batch Upload: ${items.length - toUpload.length} duplicates skipped.`);
        }

        if (toUpload.length === 0) {
            console.log("Batch Upload: No new tracks to upload.");
            return;
        }

        let successCount = 0;
        let failCount = 0;

        // 2. Parallel upload with concurrency limit (Chunking)
        const CONCURRENCY_LIMIT = 3;
        const uploadQueue = [...toUpload];
        let processedCount = 0;

        const processItem = async (item: typeof toUpload[0]) => {
            const { file, metadata } = item;
            
            let retryCount = 0;
            const maxRetries = 2;
            let success = false;

            while (retryCount <= maxRetries && !success) {
                try {
                    const randomSuffix = Math.random().toString(36).substring(2, 7);
                    const fileName = `${Date.now()}-${randomSuffix}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

                    if (file.size > 50 * 1024 * 1024) {
                        console.error(`Batch Upload: File too large: ${file.name}`);
                        toast.error(`"${file.name}" es muy pesado (Max 50MB)`);
                        failCount++;
                        success = true; // Stop retrying this specific file
                        continue;
                    }
                    
                    const { error: uploadError } = await supabase.storage
                        .from('audios')
                        .upload(fileName, file);

                    if (uploadError) {
                        if (uploadError.name === 'StorageUnknownError' || uploadError.message === 'Failed to fetch') {
                            throw uploadError;
                        }
                        throw uploadError;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('audios')
                        .getPublicUrl(fileName);
                    
                    const { error: dbError } = await supabase
                        .from('tracks')
                        .insert([{
                            title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
                            artist: metadata.artist || 'Unknown',
                            audio_url: publicUrl,
                            artwork_url: metadata.artwork,
                            timestamp: Date.now(),
                            duration: Math.round(metadata.duration || 0)
                        }]);

                    if (dbError) throw dbError;
                    
                    successCount++;
                    success = true;
                } catch (err) {
                    retryCount++;
                    if (retryCount > maxRetries) {
                        failCount++;
                    } else {
                        await new Promise(r => setTimeout(r, 1000 * retryCount));
                    }
                }
            }
            processedCount++;
            if (onProgress) onProgress(processedCount, toUpload.length);
        };

        // Process in chunks of 3
        for (let i = 0; i < uploadQueue.length; i += CONCURRENCY_LIMIT) {
            const chunk = uploadQueue.slice(i, i + CONCURRENCY_LIMIT);
            await Promise.all(chunk.map((item) => processItem(item)));
        }

        console.log(`Batch Upload Finished: ${successCount} success, ${failCount} failed.`);
        
        if (successCount > 0) {
            toast.success(`${successCount} canciones subidas a Shared Crate`);
            await fetchSharedCrate(); // Refresh to show new songs immediately
        }
        
        if (failCount > 0) {
            toast.error(`Error al subir ${failCount} canciones (revisa el formato/tamaño)`);
        }
        
        if (items.length > toUpload.length) {
            alert(`${items.length - toUpload.length} tracks were skipped as duplicates.`);
        }

        // Always refresh at the end
        await fetchSharedCrate();
      },

      removeFromSharedCrate: async (id: string, audioUrl: string) => {
        try {
            console.log("Attempting to delete track:", id);
            
            // 1. Proactively remove from state for snappier UI
            const previousCrate = get().sharedCrate;
            set(state => ({
                sharedCrate: state.sharedCrate.filter(t => t.id !== id)
            }));

            // 2. Delete from DB
            const { error: dbError, data } = await supabase
                .from('tracks')
                .delete()
                .eq('id', id)
                .select(); // Select deleted rows to confirm it actually happened

            if (dbError || !data || data.length === 0) {
                console.error("Supabase DB Delete Failure:", dbError || "No data returned (RLS block or row doesn't exist)");
                // Rollback state if it was a real DB error or RLS block
                set({ sharedCrate: previousCrate });
                // No alert as requested
                return;
            }

            // 3. Delete from Storage (extract filename from URL)
            const fileName = audioUrl.split('/').pop();
            // Basic check to see if it's a real supabase URL
            if (fileName && audioUrl.includes('.supabase.co')) {
                const { error: storageError } = await supabase.storage
                    .from('audios')
                    .remove([fileName]);
                
                if (storageError) {
                    console.warn("Supabase Storage Delete Error (may already be gone):", storageError);
                }
            }

            // 4. Refresh List to ensure sync
            await get().fetchSharedCrate();
        } catch (e: any) {
            console.error("Failed to delete from shared crate:", e);
        }
      },

      clearLocalCache: async () => {
        if (!confirm("This will permanently delete ALL local audio files and Saved Sets from this browser. Continue?")) return;
        try {
            // Delete all track blobs
            const tracks = await getAllStoredTracks();
            for (const t of tracks) {
                await deleteTrackBlob(t.id);
            }
            
            // Delete all sets
            const sets = await getAllOfflineSets();
            for (const s of sets) {
                await deleteSetFromDB(s.id);
            }

            set({ offlineSets: [] });
            toast.success("Caché y Sets Locales elmininados.");
        } catch (e) {
            console.error("Failed to clear local cache:", e);
        }
      }
    }),
    {
      name: 'dj-storage-v5', // localStorage key
      partialize: (state) => ({ 
        playlist: state.playlist,
        currentPlaylistIndex: state.currentPlaylistIndex,
        history: state.history
      }),
    }
  )
);
