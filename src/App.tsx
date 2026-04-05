import { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { MainLayout } from './components/layout/MainLayout';
import { RadioUnit } from './components/radio/RadioUnit';
import { DJConsole } from './components/dj/console/DJConsole';
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
  const initOfflineSets = useDJStore(state => state.initOfflineSets);
  
  useEffect(() => {
    initOfflineSets();
    // Silencio inicial por defecto para evitar doble sonido al arrancar
    pause();
  }, [initOfflineSets, pause]);
  
  const [showHelp, setShowHelp] = useState(false);

  const handleStart = async () => {
    console.log("Master Unlock Sequence Initiated...");
    
    // UNLOCK AUDIO HARDWARE & WEB AUDIO API
    try {
        await Tone.start();
        await Tone.context.resume();
        
        // PRIMING 1: HTML5 Audio Elements (The Radio System)
        const audio1 = document.getElementById('global-audio-player-1') as HTMLAudioElement;
        const audio2 = document.getElementById('global-audio-player-2') as HTMLAudioElement;
        
        const unlockAudio = async (el: HTMLAudioElement | null) => {
            if (!el) return;
            try {
                el.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAA+P/9P8DAA==";
                await el.play();
                el.pause();
            } catch(e) {
                console.warn(`Failed to unlock audio element ${el.id}:`, e);
            }
        };

        if (audio1 || audio2) {
            await Promise.all([unlockAudio(audio1), unlockAudio(audio2)]);
        }

        // PRIMING 2: Tone.js (Web Audio API)
        const osc = new Tone.Oscillator().toDestination();
        osc.start();
        osc.stop("+0.02");

        // Ensure Master isn't muted
        Tone.getDestination().mute = false;
        Tone.getDestination().volume.value = 0;
        
        console.log("Audio Engine Ready. State:", Tone.context.state);
    } catch (e) {
        console.warn("Global audio unlock failed:", e);
    }
    
    // ALWAYS proceed to app even if audio priming results in warnings
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

        {/* Sección 1: Radio - Ocultar en landscape móvil para foco en DJ */}
        <section className="mt-8 transition-all duration-500 landscape:hidden lg:landscape:block">
            <div className="bg-zinc-950/40 p-10 rounded-[4rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
               <RadioUnit />
               <div className="mt-12">
                  <StationList />
               </div>
            </div>
        </section>
        
        {/* Sección 2: DJ Console Prototype - Centrada y expandida en Landscape */}
        <section className="flex flex-col items-center landscape:w-screen landscape:px-2">
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
