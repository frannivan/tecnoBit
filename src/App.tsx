import { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { MainLayout } from './components/layout/MainLayout';
import { RadioUnit } from './components/radio/RadioUnit';
import { DJConsole } from './components/dj/console/DJConsole';
import { DJPlaylist } from './components/dj/console/DJPlaylist';
import { StationList } from './components/radio/StationList';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { StartScreen } from './components/common/StartScreen';
import { HelpGuide } from './components/common/HelpGuide';
import { useRadioStore } from './store/useRadioStore';
import { useDJStore } from './store/useDJStore';
import { HelpCircle, Music, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DebugConsole } from './components/common/DebugConsole';

// NEW: Main application component to separate logic from Router setup
const MixerPage = ({ showLogs = false }: { showLogs?: boolean }) => {
    useAudioPlayer();
    const pause = useRadioStore(state => state.pause);
    const hasInteracted = useRadioStore(state => state.hasInteracted);
    const setHasInteracted = useRadioStore(state => state.setHasInteracted);
    const { selectedTrack, setSelectedTrack, initOfflineSets } = useDJStore();
    
    useEffect(() => {
      initOfflineSets();
      pause();
    }, [initOfflineSets, pause]);
  
    const isPlayingA = useDJStore(state => state.isPlayingA);
    const isPlayingB = useDJStore(state => state.isPlayingB);
    
    useEffect(() => {
      if (isPlayingA || isPlayingB) {
          pause();
      }
    }, [isPlayingA, isPlayingB, pause]);
    
    const [showHelp, setShowHelp] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  
    const handleStart = async () => {
      setHasInteracted(true);
      if (!hasInteracted) setShowHelp(true);
  
      console.log("--- INITIALIZING MASTER AUDIO SESSION ---");
      await Tone.start();
      await Tone.context.resume();
      
      const player1 = document.getElementById('global-audio-player-1') as HTMLAudioElement;
      const player2 = document.getElementById('global-audio-player-2') as HTMLAudioElement;
  
      if (player1) {
          try {
              const originalMute = player1.muted;
              player1.muted = true;
              player1.play().then(() => {
                  setTimeout(() => {
                      player1.pause();
                      player1.muted = originalMute;
                      console.log("Hardware Session: BLESSED via Player 1");
                  }, 100);
              }).catch(e => console.warn("Player 1 blessing failed", e));
          } catch (e) {
              console.error("Blessing error", e);
          }
      }
  
      if (player2) {
          player2.muted = true;
          player2.play().then(() => {
              setTimeout(() => player2.pause(), 100);
          }).catch(() => {});
      }
      console.log("Web Audio Engine: READY (State:", Tone.context.state, ")");
    };

    return (
        <MainLayout>
          <div className="flex flex-col gap-12 md:gap-24 relative px-2 sm:px-6 lg:px-8 pb-32 max-w-full md:max-w-7xl mx-auto w-full">
            <AnimatePresence>
              {!hasInteracted && <StartScreen onStart={handleStart} />}
              {showHelp && <HelpGuide onClose={() => setShowHelp(false)} />}
            </AnimatePresence>

            {showLogs && <DebugConsole isFixed={true} />}
    
            <section className="landscape:hidden sm:landscape:hidden md:landscape:block">
                <div className="bg-zinc-950/40 p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border border-white/5 backdrop-blur-3xl shadow-2xl space-y-12">
                    <div className="space-y-6">
                        <RadioUnit />
                        <div className="relative pt-6 border-t border-white/5">
                            <div className="flex justify-between items-end mb-4 px-2">
                                 <h3 className="text-[10px] uppercase font-mono text-zinc-400 tracking-[0.3em] font-bold">Transmisiones Disponibles</h3>
                                 <span className="text-[8px] font-mono text-zinc-600 bg-white/5 px-2 py-1 rounded">ESTACIONES SELECCIONADAS</span>
                            </div>
                            <StationList />
                        </div>
                    </div>
    
                   <div className="mt-12 bg-zinc-950/20 rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden min-h-[400px]">
                      <h3 className="text-[10px] uppercase font-mono text-zinc-500 p-6 pb-2 tracking-widest font-bold">Biblioteca Global / Master Crate</h3>
                      <DJPlaylist 
                        selectedTrackId={selectedTrack?.id || null}
                        onSelect={(track) => {
                            setSelectedTrack(track);
                        }}
                      />
                   </div>
                </div>
            </section>
            
            <section className="flex flex-col items-center landscape:mt-0 sm:landscape:mt-0">
                 <DJConsole />
            </section>
    
            <button 
                onClick={() => setShowHelp(true)}
                className="fixed bottom-8 right-8 z-50 bg-zinc-900 p-3.5 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10 hover:border-emerald-500 hover:text-emerald-500 transition-all group scale-90 hover:scale-100 md:landscape:hidden"
                title="Help Guide"
            >
                <HelpCircle size={24} />
            </button>
    
            <button 
                onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] bg-orange-500 p-3 rounded-full shadow-2xl border border-white/20 hidden landscape:flex sm:landscape:flex md:landscape:hidden animate-pulse"
                title="Open Master Crate"
            >
                <Music size={24} className="text-black" />
            </button>
    
            <AnimatePresence>
                {isLibraryOpen && (
                    <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 left-0 w-[80vw] bg-zinc-950 z-[70] shadow-[30px_0_60px_rgba(0,0,0,0.8)] border-r border-white/10 p-4 flex flex-col md:hidden"
                    >
                        <div className="flex justify-between items-center mb-4 px-2">
                            <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest">Master Crate</h3>
                            <button onClick={() => setIsLibraryOpen(false)} className="p-2 text-zinc-500 hover:text-white">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden rounded-2xl border border-white/5 bg-black/40">
                             <DJPlaylist 
                                selectedTrackId={selectedTrack?.id || null}
                                onSelect={(track) => {
                                    setSelectedTrack(track);
                                    setIsLibraryOpen(false);
                                }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
    
            <AnimatePresence>
                {isLibraryOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsLibraryOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] md:hidden"
                    />
                )}
            </AnimatePresence>
          </div>
        </MainLayout>
    );
};

function App() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<MixerPage />} />
            <Route path="/admin" element={<MixerPage showLogs={true} />} />
        </Routes>
    </Router>
  );
}

export default App;
