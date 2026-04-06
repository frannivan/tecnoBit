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
import toast from 'react-hot-toast';

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
        // 1. Unblock Tone.js (Sync context resumption)
        await Tone.start();
        await Tone.context.resume();

        // 2. Setup Persistent HTML5 Audio Keeper (iOS focus)
        const setupKeeper = (elId: string) => {
            let el = document.getElementById(elId) as HTMLAudioElement | null;
            if (!el) {
                el = document.createElement('audio');
                el.id = elId;
                el.style.display = 'none';
                el.loop = true;
                document.body.appendChild(el);
            }
            el.setAttribute('playsinline', 'true');
            el.volume = 1;
            // 1s silent mono 16bit 8khz wav (extremely small but valid)
            el.src = "data:audio/wav;base64,UklGRjIAAABXQVZFRm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YRAAAAAAAAAAAAAAAAAAAAAAAAAA";
            el.play().catch(e => {
                console.warn("Keeper play blocked:", e);
                // Fallback attempt
                setTimeout(() => el && el.play().catch(() => {}), 1000);
            });
        };

        setupKeeper('mobile-audio-keeper');

        // 3. Web Audio Priming
        const osc = new Tone.Oscillator(440, "sine").toDestination();
        osc.volume.value = -Infinity;
        osc.start(); // LEAVE IT RUNNING BUT SILENT

        Tone.Destination.mute = false;
        Tone.Destination.volume.value = 0;

        // 4. Persistence Watchdog (Aggressive for mobile)
        setInterval(() => {
            if (Tone.context.state !== 'running') {
                Tone.context.resume();
                console.log("Context Guard: Auto-resumed");
            }
        }, 2000);

        console.log("Audio Engine Authorized. Watchdog active. State:", Tone.context.state);
        setAudioStatus(Tone.context.state);
    } catch (e) {
        console.warn("Audio Context unlock failed:", e);
    }

    setHasInteracted(true);
    if (!hasInteracted) setShowHelp(true);
  };

  const [audioStatus, setAudioStatus] = useState<string>(Tone.context.state);

  useEffect(() => {
    const timer = setInterval(() => {
        setAudioStatus(Tone.context.state);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRescue = async () => {
      try {
          await Tone.start();
          await Tone.context.resume();
          const osc = new Tone.Oscillator(440, "sine").toDestination();
          osc.volume.value = -12;
          osc.start().stop("+0.1");
          toast.success("Audio Engine Resumed");
          setAudioStatus(Tone.context.state);
      } catch (e) {
          toast.error("Rescue failed");
      }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-24 relative px-4 sm:px-6 lg:px-8 pb-32 max-w-7xl mx-auto w-full">
        <AnimatePresence>
          {!hasInteracted && <StartScreen onStart={handleStart} />}
          {showHelp && <HelpGuide onClose={() => setShowHelp(false)} />}
        </AnimatePresence>

        {/* AUDIO MONITOR FOR MOBILE DEBUGGING */}
        <div className="fixed top-4 right-4 z-[100] flex flex-col items-end gap-2 pointer-events-none sm:pointer-events-auto">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md transition-all ${
                audioStatus === 'running' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
            }`}>
                Engine: {audioStatus}
            </div>
            {audioStatus !== 'running' && hasInteracted && (
                <button 
                    onClick={handleRescue}
                    className="px-3 py-1.5 bg-orange-500 text-black text-[10px] font-black rounded-lg shadow-xl hover:bg-orange-400 transition-all pointer-events-auto"
                >
                    FIX AUDIO
                </button>
            )}
        </div>

        {/* Sección 1: Radio - Restaurada y FUNCIONAL */}
        <section className="mt-8 transition-all duration-500">
            <div className="bg-zinc-950/40 p-10 rounded-[4rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
               <RadioUnit />
               <div className="mt-12">
                  <StationList />
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
