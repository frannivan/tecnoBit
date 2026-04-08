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
import { HelpCircle, AlertTriangle } from 'lucide-react';
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

  // AUTOMATED AUDIO BLESSING (v1.7.0)
  const handleStart = async () => {
    setHasInteracted(true);
    if (!hasInteracted) setShowHelp(true);

    console.log("--- INITIALIZING MASTER AUDIO SESSION ---");

    // 1. Start Tone.js
    await Tone.start();
    await Tone.context.resume();
    
    // 2. PROGRAMMATIC BLESSING
    // We simulate what the user did: Play/Stop a real HTML5 Audio element.
    // This "blesses" the browser's hardware session for Web Audio (Mixer).
    const player1 = document.getElementById('global-audio-player-1') as HTMLAudioElement;
    const player2 = document.getElementById('global-audio-player-2') as HTMLAudioElement;

    if (player1) {
        try {
            const originalMute = player1.muted;
            const originalSrc = player1.src;
            
            player1.muted = true;
            // Play a real stream silently for 100ms
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
      <div className="flex flex-col gap-12 md:gap-24 relative px-4 sm:px-6 lg:px-8 pb-32 max-w-7xl mx-auto w-full">
        <AnimatePresence>
          {!hasInteracted && <StartScreen onStart={handleStart} />}
          {showHelp && <HelpGuide onClose={() => setShowHelp(false)} />}
        </AnimatePresence>

        {/* MUTE SWITCH WARNING (FOR IPHONE) */}
        <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl flex items-center gap-4 text-orange-200 text-xs md:text-sm animate-pulse lg:hidden">
            <AlertTriangle className="text-orange-500 shrink-0" size={20} />
            <p>
                <strong>iPhone User:</strong> Revisa que el interruptor físico lateral esté en modo <strong>Timbre (Ring)</strong>. Si está en silencio, el Mixer no se escuchará.
            </p>
        </div>

        {/* Sección 1: Radio & Library */}
        <section className="">
            <div className="bg-zinc-950/40 p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border border-white/5 backdrop-blur-3xl shadow-2xl space-y-12">
                
                {/* 1. Radio Unit */}
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
