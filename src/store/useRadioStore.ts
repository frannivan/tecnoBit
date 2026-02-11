import { create } from 'zustand';
import { type RadioStation, stations } from '../data/stations';

interface RadioState {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setStation: (station: RadioStation) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  play: () => void;
  pause: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRadioStore = create<RadioState>((set) => ({
  currentStation: stations[0] || null,
  isPlaying: false,
  volume: 0.5,
  isMuted: false,
  isLoading: false,
  error: null,

  setStation: (station) => set({ currentStation: station, isPlaying: true, isLoading: true, error: null }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying, error: null })),
  play: () => set({ isPlaying: true, error: null }),
  pause: () => set({ isPlaying: false }),
  setVolume: (volume) => set({ volume }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isPlaying: false, isLoading: false }),
}));
