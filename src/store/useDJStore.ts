import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAllStoredTracks, deleteTrackBlob } from '../utils/indexedDB';

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
}

interface DJState {
  playlist: Track[];
  history: Track[];
  userCrate: Track[]; // Local files from IndexedDB
  currentPlaylistIndex: number; // Track which song is playing in the playlist
  
  // Actions
  addToPlaylist: (track: Track) => void;
  removeFromPlaylist: (id: string) => void;
  addToHistory: (track: Track) => void;
  reorderPlaylist: (newOrder: Track[]) => void;
  playNextTrack: () => Track | null; // Returns next track or null if none
  setCurrentPlaylistIndex: (index: number) => void;
  
  // New Local Crate Actions
  addToUserCrate: (track: Track) => void;
  removeFromUserCrate: (id: string) => void;
  initUserCrate: () => Promise<void>;
}

export const useDJStore = create<DJState>()(
  persist(
    (set, get) => ({
      playlist: [],
      userCrate: [],
      currentPlaylistIndex: -1,
      history: [
        { 
          id: 'mp3-1', 
          title: 'Reflected', 
          artist: 'Original Mix', 
          timestamp: Date.now(), 
          audioUrl: 'Audios/01 Reflected (Original Mix).mp3',
          duration: 342,
          artwork: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&h=100&fit=crop'
        },
        { 
          id: 'mp3-2', 
          title: 'The Pressure', 
          artist: 'Extended Mix', 
          timestamp: Date.now() - 100000, 
          audioUrl: 'Audios/01 The Pressure (Extended Mix).mp3',
          duration: 415,
          artwork: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=100&h=100&fit=crop'
        },
        { 
          id: 'mp3-3', 
          title: 'Hallelujah', 
          artist: 'Original Mix', 
          timestamp: Date.now() - 200000, 
          audioUrl: 'Audios/23 Hallelujah (Original Mix).mp3',
          duration: 388,
          artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop'
        },
        { 
          id: 'mp3-4', 
          title: 'Anupam', 
          artist: 'Original Mix', 
          timestamp: Date.now() - 300000, 
          audioUrl: 'Audios/Anupam (Original Mix).mp3',
          duration: 320,
          artwork: 'https://images.unsplash.com/photo-1514525253361-b83a859b127e?w=100&h=100&fit=crop'
        },
        { 
          id: 'mp3-5', 
          title: 'Vociferous', 
          artist: 'Club Mix', 
          timestamp: Date.now() - 400000, 
          audioUrl: 'Audios/Vociferous (Club Mix).mp3',
          duration: 365,
          artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop'
        },
      ],

      addToPlaylist: (track) => set((state) => {
        // Remove duplicate if exists (to move it to the end)
        const filteredPlaylist = state.playlist.filter(t => t.id !== track.id);
        return {
          playlist: [...filteredPlaylist, track]
        };
      }),

      removeFromPlaylist: (id) => set((state) => ({
        playlist: state.playlist.filter(t => t.id !== id)
      })),

      addToHistory: (track) => set((state) => ({
        history: [track, ...state.history]
      })),

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

      addToUserCrate: (track) => set((state) => ({
        userCrate: [track, ...state.userCrate]
      })),

      removeFromUserCrate: async (id) => {
        await deleteTrackBlob(id);
        set((state) => ({
          userCrate: state.userCrate.filter(t => t.id !== id)
        }));
      },

      initUserCrate: async () => {
        try {
          const stored = await getAllStoredTracks();
          const tracks: Track[] = stored.map(s => ({
            id: s.id,
            title: s.name,
            artist: 'Local',
            timestamp: Date.now(),
            audioUrl: URL.createObjectURL(s.blob), // Re-generate URL
            duration: 0
          }));
          set({ userCrate: tracks });
        } catch (e) {
          console.error("Failed to load user crate:", e);
        }
      }
    }),
    {
      name: 'dj-storage-v4', // localStorage key
      partialize: (state) => ({ 
        playlist: state.playlist,
        currentPlaylistIndex: state.currentPlaylistIndex
      }), // Only persist playlist and index, not history
    }
  )
);
