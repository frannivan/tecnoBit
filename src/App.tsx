import { useState, useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { RadioUnit } from './components/radio/RadioUnit';
import { DJDeck } from './components/dj/DJDeck';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { StartScreen } from './components/common/StartScreen';
import { HelpGuide } from './components/common/HelpGuide';
import { StationList } from './components/radio/StationList';
import { useRadioStore } from './store/useRadioStore';
import { useDJStore } from './store/useDJStore';
import { HelpCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

function App() {
  // Initialize audio player logic
  useAudioPlayer();
  const play = useRadioStore(state => state.play);
  const hasInteracted = useRadioStore(state => state.hasInteracted);
  const setHasInteracted = useRadioStore(state => state.setHasInteracted);
  const initOfflineSets = useDJStore(state => state.initOfflineSets);
  
  // Initialize offline sets from IndexedDB
  useEffect(() => {
    initOfflineSets();
  }, [initOfflineSets]);
  
  // Local state only for help guide
  const [showHelp, setShowHelp] = useState(false);

  const handleStart = () => {
    setHasInteracted(true);
    play(); // Resume/Start audio context
    if (!hasInteracted) setShowHelp(true); // Only auto-show help on first EVER start
  };

  return (
    <MainLayout>
      {/* Dual Global Audio Elements for Crossfading */}
      <audio id="global-audio-player-1" crossOrigin="anonymous" className="hidden" />
      <audio id="global-audio-player-2" crossOrigin="anonymous" className="hidden" />

      <AnimatePresence>
        {!hasInteracted && <StartScreen onStart={handleStart} />}
        {showHelp && <HelpGuide onClose={() => setShowHelp(false)} />}
      </AnimatePresence>

      <div className="flex flex-col gap-12 relative">
        <button 
            onClick={() => setShowHelp(true)}
            className="fixed bottom-6 right-6 z-40 bg-zinc-800 p-3 rounded-full shadow-lg border border-zinc-600 hover:bg-zinc-700 hover:border-orange-500 hover:text-orange-500 transition-all"
            title="Help Guide"
        >
            <HelpCircle size={24} />
        </button>

        <section>
            <RadioUnit />
            <StationList />
        </section>
        
        <section>
            <DJDeck />
        </section>
      </div>
    </MainLayout>
  );
}

export default App;
