import { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { MainLayout } from './components/layout/MainLayout';
import { RadioUnit } from './components/radio/RadioUnit';
import { DJConsole } from './components/dj/console/DJConsole';
import { DJPlaylist } from './components/dj/console/DJPlaylist';
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

  const handleStart = async () => {
    // 1. PURE USER GESTURE (MUST BE ABSOLUTE FIRST LINE)
    // Create a temporary audio element directly on the body (The Radio Strategy)
    const unlocker = document.createElement('audio');
    unlocker.autoplay = true;
    unlocker.setAttribute('playsinline', 'true');
    unlocker.style.display = 'none';
    
    // Create a valid 1-second silent WAV Blob
    const buffer = new Uint8Array([82,73,70,70,36,0,0,0,87,65,86,69,102,109,116,32,16,0,0,0,1,0,1,0,64,31,0,0,64,31,0,0,1,0,8,0,100,97,116,97,0,0,0,0]);
    const blob = new Blob([buffer], { type: 'audio/wav' });
    unlocker.src = URL.createObjectURL(blob);
    
    document.body.appendChild(unlocker);
    unlocker.play()
        .then(() => console.log("Global Hardware Unlock: SUCCESS (BLOB)"))
        .catch((err) => console.warn("Global Hardware Unlock: BLOCKED (BLOB)", err.name, err.message));

    // 2. TONE START
    try {
        await Tone.start();
        await Tone.context.resume();
        console.log("Audio engine ready. State:", Tone.context.state);
    } catch (e) {
        console.warn("Tone.js Start failed:", e);
    }

    // 3. SET INTERACTION (UI PROGRESS)
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
                <div className="text-[10px] uppercase font-mono text-zinc-500 opacity-50">v1.5.59 (STABILITY_FIX) // BLOB_STRATEGY</div>
               
               {/* MASTER CRATE (Radio Mode) */}
               <div className="mt-16 bg-zinc-950/20 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden min-h-[400px]">
                  <DJPlaylist 
                    selectedTrackId={selectedTrack?.id || null}
                    onSelect={(track) => {
                        setSelectedTrack(track);
                    }}
                  />
               </div>
            </div>
        </section>
        
        {/* Audio unlockers are now managed dynamically to avoid DOM nesting issues */}
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
