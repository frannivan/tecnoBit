import { create } from 'zustand';
import { type RadioStation, stations } from '../data/stations';

interface RadioState {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  
  // Actions
  setStation: (station: RadioStation) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  play: () => void;
  pause: () => void;
  setLoading: (loading: boolean) => void;
}

export const useRadioStore = create<RadioState>((set) => ({
  currentStation: stations[0] || null,
  isPlaying: false,
  volume: 0.5,
  isMuted: false,
  isLoading: false,

  setStation: (station) => set({ currentStation: station, isPlaying: true, isLoading: true }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setVolume: (volume) => set({ volume }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setLoading: (loading) => set({ isLoading: loading }),
}));
