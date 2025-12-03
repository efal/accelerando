import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Settings2, Sparkles, AlertCircle, RefreshCw, Volume2 } from 'lucide-react';
import { audioEngine } from './services/audioEngine';
import { getPracticeAdvice } from './services/geminiService';
import { Knob } from './components/Knob';
import { PracticeSettings } from './types';

const App: React.FC = () => {
  // State for Settings
  const [settings, setSettings] = useState<PracticeSettings>({
    startBpm: 80,
    maxBpm: 200,
    increaseAmount: 0,
    increaseIntervalBars: 4,
    beatsPerBar: 4
  });

  // Runtime State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBpm, setCurrentBpm] = useState(settings.startBpm);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Initialize Audio Engine settings whenever React state changes
  useEffect(() => {
    audioEngine.setSettings(
      currentBpm, 
      settings.beatsPerBar, 
      settings.increaseAmount, 
      settings.increaseIntervalBars,
      settings.maxBpm
    );
  }, [settings, currentBpm]);

  // Setup Engine Callbacks only once
  useEffect(() => {
    audioEngine.setOnBeat((beat) => {
      setCurrentBeat(beat);
    });

    audioEngine.setOnBpmChange((newBpm) => {
      // We update the 'current' display without changing the 'start' setting
      setCurrentBpm(newBpm);
    });
  }, []);

  const togglePlay = () => {
    if (!isPlaying) {
      // Reset BPM to start value if we stopped and started again
      setCurrentBpm(settings.startBpm);
      audioEngine.setSettings(
        settings.startBpm, 
        settings.beatsPerBar, 
        settings.increaseAmount, 
        settings.increaseIntervalBars,
        settings.maxBpm
      );
      audioEngine.start();
      setIsPlaying(true);
    } else {
      audioEngine.stop();
      setIsPlaying(false);
      setCurrentBeat(-1);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiMessage(null);
    try {
      const routine = await getPracticeAdvice(aiPrompt);
      setSettings(prev => ({
        ...prev,
        startBpm: routine.startBpm,
        increaseAmount: routine.increaseAmount,
        increaseIntervalBars: routine.increaseIntervalBars
      }));
      setCurrentBpm(routine.startBpm);
      setAiMessage(routine.description);
    } catch (e) {
      setAiMessage("Konnte keine Routine laden. Bitte versuche es erneut.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col items-center py-8 px-4 font-sans">
      
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight mb-2">
          Accelerando
        </h1>
        <p className="text-slate-400 text-sm">Der smarte Speed-Trainer</p>
      </header>

      {/* Main Visualizer */}
      <div className="relative w-64 h-64 mb-10 flex items-center justify-center">
        {/* Pulsing Rings */}
        <div className={`absolute inset-0 rounded-full border-4 transition-all duration-100 ${
          isPlaying && currentBeat === 0 ? 'border-blue-500 scale-105 opacity-100 shadow-[0_0_40px_rgba(59,130,246,0.5)]' : 'border-slate-800 scale-100 opacity-50'
        }`}></div>
         <div className={`absolute inset-4 rounded-full border-2 transition-all duration-75 ${
          isPlaying && currentBeat >= 0 ? 'border-slate-600' : 'border-slate-800'
        }`}></div>
        
        {/* Center Display */}
        <div className="text-center z-10">
          <div className="text-6xl font-black text-white tabular-nums tracking-tighter">
            {Math.round(currentBpm)}
          </div>
          <div className="text-blue-400 font-semibold uppercase tracking-widest text-xs mt-1">BPM</div>
        </div>

        {/* Beat Indicators */}
        <div className="absolute bottom-8 flex gap-2">
          {Array.from({ length: settings.beatsPerBar }).map((_, i) => (
            <div 
              key={i} 
              className={`w-3 h-3 rounded-full transition-all duration-75 ${
                currentBeat === i 
                  ? (i === 0 ? 'bg-blue-400 shadow-lg scale-125' : 'bg-slate-200 shadow scale-110') 
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Play Controls */}
      <div className="mb-12">
        <button
          onClick={togglePlay}
          className={`
            w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-2xl
            ${isPlaying 
              ? 'bg-slate-800 text-red-500 border-2 border-slate-700 hover:border-red-500/50' 
              : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-blue-500/25'}
          `}
        >
          {isPlaying ? <Square fill="currentColor" size={32} /> : <Play fill="currentColor" className="ml-1" size={32} />}
        </button>
      </div>

      {/* Settings Grid */}
      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="md:col-span-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
           <h3 className="text-slate-300 font-semibold mb-4 flex items-center gap-2">
             <Settings2 size={18} /> Grundeinstellungen
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Knob 
                label="Start Geschwindigkeit" 
                value={settings.startBpm} 
                onChange={(v) => {
                  setSettings({...settings, startBpm: v});
                  if (!isPlaying) setCurrentBpm(v);
                }} 
                unit="BPM"
                min={30} max={250}
             />
             <Knob 
                label="Taktart" 
                value={settings.beatsPerBar} 
                onChange={(v) => setSettings({...settings, beatsPerBar: v})} 
                min={1} max={12}
             />
           </div>
        </div>

        <div className="md:col-span-2 bg-slate-800/50 p-4 rounded-xl border border-blue-900/30 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <RefreshCw size={100} />
           </div>
           <h3 className="text-blue-300 font-semibold mb-4 flex items-center gap-2 relative z-10">
             <Volume2 size={18} /> Automatische Steigerung (Trainer)
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
             <Knob 
                label="Steigerung" 
                value={settings.increaseAmount} 
                onChange={(v) => setSettings({...settings, increaseAmount: v})} 
                min={0} max={10} unit="BPM"
             />
             <Knob 
                label="Intervall (Takte)" 
                value={settings.increaseIntervalBars} 
                onChange={(v) => setSettings({...settings, increaseIntervalBars: v})} 
                min={1} max={32}
             />
           </div>
           <p className="text-xs text-slate-400 mt-4 relative z-10">
             {settings.increaseAmount > 0 
               ? `Geschwindigkeit erhöht sich um ${settings.increaseAmount} BPM alle ${settings.increaseIntervalBars} Takte.` 
               : "Automatische Steigerung ist deaktiviert."}
           </p>
        </div>
      </div>

      {/* AI Section */}
      <div className="w-full max-w-2xl">
        <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-6">
          <h3 className="text-indigo-200 font-semibold mb-3 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-400" />
            KI Übungs-Coach
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Beschreibe, was du üben möchtest (z.B. "Gitarren Skalen für Anfänger" oder "Schnelles Drum-Fill"), und die KI stellt das Metronom für dich ein.
          </p>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="z.B. Klavier Arpeggios steigern..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
            />
            <button 
              onClick={handleAiGenerate}
              disabled={isAiLoading || !aiPrompt.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
            >
              {isAiLoading ? '...' : 'Generieren'}
            </button>
          </div>

          {aiMessage && (
            <div className="mt-4 bg-indigo-950/50 border border-indigo-500/20 p-3 rounded-lg flex items-start gap-3">
              <div className="mt-1"><AlertCircle size={16} className="text-indigo-400" /></div>
              <p className="text-sm text-indigo-100 italic">{aiMessage}</p>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-12 text-slate-600 text-xs">
        &copy; {new Date().getFullYear()} Accelerando Music Tools
      </footer>

    </div>
  );
};

export default App;
