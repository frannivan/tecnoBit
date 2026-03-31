import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type RadioStation, stations } from '../data/stations';

interface RadioState {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  hasInteracted: boolean;
  activeDeck: 1 | 2; // Track which global player is active
  
  // Actions
  setStation: (station: RadioStation) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  play: () => void;
  pause: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasInteracted: (hasInteracted: boolean) => void;
  setActiveDeck: (deck: 1 | 2) => void;
}

export const useRadioStore = create<RadioState>()(
  persist(
    (set) => ({
      currentStation: stations[0] || null,
      isPlaying: false,
      volume: 0.5,
      isMuted: false,
      isLoading: false,
      error: null,
      hasInteracted: false,
      activeDeck: 1,

      setStation: (station) => set({ currentStation: station, isPlaying: true, isLoading: true, error: null }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying, error: null })),
      play: () => set({ isPlaying: true, error: null }),
      pause: () => set({ isPlaying: false }),
      setVolume: (volume) => set({ volume }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error, isLoading: false }),
      setHasInteracted: (hasInteracted) => set({ hasInteracted }),
      setActiveDeck: (deck) => set({ activeDeck: deck }),
    }),
    {
      name: 'tecnobit-storage', // unique name
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        // Only persist these fields
        currentStation: state.currentStation, 
        volume: state.volume, 
        isMuted: state.isMuted
      }),
    }
  )
);
