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
import { HelpCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

function App() {
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

  const handleStart = () => {
    setHasInteracted(true);
    if (!hasInteracted) setShowHelp(true);

    // SIMPLEST START POSSIBLE
    Tone.start().then(() => {
        Tone.context.resume();
        console.log("Web Audio Engine: READY");
    });
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-12 md:gap-24 relative px-4 sm:px-6 lg:px-8 pb-32 max-w-7xl mx-auto w-full">
        <AnimatePresence>
          {!hasInteracted && <StartScreen onStart={handleStart} />}
          {showHelp && <HelpGuide onClose={() => setShowHelp(false)} />}
        </AnimatePresence>

        {/* Sección 1: Radio & Library */}
        <section className="mt-8">
            <div className="bg-zinc-950/40 p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border border-white/5 backdrop-blur-3xl shadow-2xl space-y-12">
                
                {/* 1. Radio Unit */}
                <div className="space-y-6">
                    <RadioUnit />
                    <div className="relative pt-6 border-t border-white/5">
                        <h3 className="text-[10px] uppercase font-mono text-zinc-400 mb-4 px-2 tracking-[0.3em] font-bold">Transmisiones Disponibles</h3>
                        <StationList />
                    </div>
                </div>

               {/* 2. MASTER CRATE */}
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
        
        {/* Sección 2: DJ Console */}
        <section className="flex flex-col items-center">
             <DJConsole />
        </section>

        <button 
            onClick={() => setShowHelp(true)}
            className="fixed bottom-8 right-8 z-50 bg-zinc-900 p-3.5 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10 hover:border-emerald-500 hover:text-emerald-500 transition-all group scale-90 hover:scale-100"
            title="Help Guide"
        >
            <HelpCircle size={24} />
        </button>
      </div>
    </MainLayout>
  );
}

export default App;
