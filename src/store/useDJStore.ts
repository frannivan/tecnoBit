import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  artist: string;
  timestamp: number;
}

interface DJState {
  playlist: Track[];
  history: Track[];
  
  // Actions
  addToPlaylist: (track: Track) => void;
  removeFromPlaylist: (id: string) => void;
  addToHistory: (track: Track) => void;
  reorderPlaylist: (newOrder: Track[]) => void;
}

export const useDJStore = create<DJState>((set) => ({
  playlist: [],
  history: [
    { id: '1', title: 'Strobe', artist: 'deadmau5', timestamp: Date.now() },
    { id: '2', title: 'Opus', artist: 'Eric Prydz', timestamp: Date.now() - 100000 },
    { id: '3', title: 'Xpander', artist: 'Sasha', timestamp: Date.now() - 200000 },
  ], // Mock history for now

  addToPlaylist: (track) => set((state) => ({ 
    playlist: [...state.playlist, { ...track, id: `${track.id}-${Date.now()}` }] 
  })),
  removeFromPlaylist: (id) => set((state) => ({ 
    playlist: state.playlist.filter((t) => t.id !== id) 
  })),
  addToHistory: (track) => set((state) => ({ 
    history: [track, ...state.history].slice(0, 50) 
  })),
  reorderPlaylist: (newOrder) => set({ playlist: newOrder }),
}));
