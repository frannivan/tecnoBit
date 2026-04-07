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

    // 2. TRIGGER PERMANENT KEEPER
    // We use a physical file with volume 0 to ensure iOS blessings without background noise.
    const keeper = document.getElementById('permanent-keeper') as HTMLAudioElement;
    if (keeper) {
        keeper.src = "/Audios/Vociferous (Club Mix).mp3"; 
        keeper.volume = 0; 
        keeper.loop = true;
        keeper.play()
            .then(() => console.log("Hardware Session: PERMANENTLY_ACTIVE (SILENT_MP3)"))
            .catch((err) => console.warn("Hardware Session: FAILED", err.name));
    }

    // 3. TONE START
    Tone.start().then(() => {
        Tone.context.resume();
        Tone.Destination.mute = false;
        Tone.Destination.volume.value = 0;
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

        {/* VERSION TAG - TOP RIGHT OF FIRST SECTION */}
        <div className="absolute top-2 right-6 md:right-12 z-10">
            <div className="text-[10px] uppercase font-mono text-zinc-500 bg-black/40 px-3 py-1 rounded-full border border-white/5 backdrop-blur-md">
                v1.5.67 (PRODUCTION_PRO) // STABLE_AUDIO_V4
            </div>
        </div>

        {/* Sección 1: Radio & Library */}
        <section className="mt-8">
            <div className="bg-zinc-950/40 p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border border-white/5 backdrop-blur-3xl shadow-2xl space-y-8">
                
                {/* Radio Unit */}
                <RadioUnit />
                
                {/* Station Selection */}
                <div className="relative pt-4">
                    <h3 className="text-[10px] uppercase font-mono text-zinc-500 mb-4 px-2 tracking-widest hidden md:block">Available Transmissions</h3>
                    <StationList />
                </div>

               {/* MASTER CRATE */}
               <div className="mt-12 bg-zinc-950/20 rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden min-h-[400px]">
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
