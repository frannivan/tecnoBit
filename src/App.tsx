import { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { MainLayout } from './components/layout/MainLayout';
import { RadioUnit } from './components/radio/RadioUnit';
import { DJConsole } from './components/dj/console/DJConsole';
import { DJPlaylist } from './components/dj/console/DJPlaylist';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { StartScreen } from './components/common/StartScreen';
import { HelpGuide } from './components/common/HelpGuide';
import { StationList } from './components/radio/StationList';
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

  const handleStart = async () => {
    try {
        await Tone.start();
        await Tone.context.resume();
    } catch (e) {
        console.warn("Audio Context unlock failed:", e);
    }

    setHasInteracted(true);
    if (!hasInteracted) setShowHelp(true);
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-24 relative px-4 sm:px-6 lg:px-8 pb-32 max-w-7xl mx-auto w-full">
        <AnimatePresence>
          {!hasInteracted && <StartScreen onStart={handleStart} />}
          {showHelp && <HelpGuide onClose={() => setShowHelp(false)} />}
        </AnimatePresence>

        {/* Sección 1: Radio - Con Libreria Integrada */}
        <section className="mt-8 transition-all duration-500">
            <div className="bg-zinc-950/40 p-10 rounded-[4rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
               <RadioUnit />
               <div className="mt-12">
                  <StationList />
               </div>
               
               {/* MASTER CRATE (Radio Mode) */}
               <div className="mt-16 bg-zinc-950/20 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden min-h-[400px]">
                  <DJPlaylist 
                    selectedTrackId={selectedTrack?.id || null}
                    onSelect={(track) => {
                        setSelectedTrack(track);
                        window.dispatchEvent(new CustomEvent('radio-play-track', { detail: track }));
                    }}
                  />
               </div>
            </div>
        </section>
        
        {/* Sección 2: DJ Console Prototype */}
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
