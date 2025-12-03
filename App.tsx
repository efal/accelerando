import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Settings2, RefreshCw, Volume2, Zap } from 'lucide-react';
import { audioEngine } from './services/audioEngine';

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



  return (
    <div className="min-h-screen relative flex flex-col items-center py-8 px-4 font-sans">

      {/* Floating particles for atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-cyan-400 opacity-60 floating-particle" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-20 w-3 h-3 rounded-full bg-purple-400 opacity-40 floating-particle" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-2 h-2 rounded-full bg-pink-400 opacity-50 floating-particle" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-cyan-400 opacity-30 floating-particle" style={{ animationDelay: '1s' }}></div>
      </div>

      <header className="mb-12 text-center relative z-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Zap className="text-neon-cyan" size={36} />
          <h1 className="text-5xl font-black text-neon-cyan tracking-wider">
            ACCELERANDO
          </h1>
          <Zap className="text-neon-cyan" size={36} />
        </div>
        <p className="text-purple-300 text-sm tracking-widest uppercase">Speed Trainer • Neon Edition</p>
      </header>

      {/* Main BPM Display - Neon Ring */}
      <div className="relative w-80 h-80 mb-12 flex items-center justify-center">
        {/* Outer glow ring */}
        <div className={`absolute inset-0 rounded-full border-4 transition-all duration-150 ${isPlaying && currentBeat === 0
          ? 'border-cyan-400 scale-110 neon-glow-cyan neon-pulse'
          : 'border-cyan-900/30 scale-100'
          }`}></div>

        {/* Middle ring */}
        <div className={`absolute inset-8 rounded-full border-2 transition-all duration-100 ${isPlaying && currentBeat >= 0
          ? 'border-purple-500/50 neon-glow-purple'
          : 'border-purple-900/20'
          }`}></div>

        {/* Inner ring with glassmorphism */}
        <div className="absolute inset-16 rounded-full glass-card flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl font-black text-neon-cyan tabular-nums tracking-tighter">
              {Math.round(currentBpm)}
            </div>
            <div className="text-neon-purple font-bold uppercase tracking-[0.3em] text-sm mt-2">BPM</div>
          </div>
        </div>

        {/* Beat Indicators */}
        <div className="absolute -bottom-6 flex gap-3">
          {Array.from({ length: settings.beatsPerBar }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${currentBeat === i
                ? (i === 0
                  ? 'bg-cyan-400 neon-glow-cyan scale-150 beat-active'
                  : 'bg-pink-400 neon-glow-pink scale-125 beat-active')
                : 'bg-slate-700/50 border border-slate-600/30'
                }`}
            />
          ))}
        </div>
      </div>

      {/* Play/Stop Button - Neon Style */}
      <div className="mb-16 relative z-10">
        <button
          onClick={togglePlay}
          className={`
            btn-neon w-24 h-24 rounded-full flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 relative
            ${isPlaying
              ? 'bg-gradient-to-br from-pink-600 to-red-600 border-2 border-pink-400 neon-glow-pink'
              : 'bg-gradient-to-br from-cyan-600 to-blue-600 border-2 border-cyan-400 neon-glow-cyan'}
          `}
        >
          {isPlaying
            ? <Square fill="white" size={40} className="relative z-10" />
            : <Play fill="white" className="ml-1 relative z-10" size={40} />}
        </button>
      </div>

      {/* Settings Grid - Glassmorphism Cards */}
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">

        {/* Basic Settings */}
        <div className="glass-card p-6">
          <h3 className="text-cyan-300 font-bold mb-5 flex items-center gap-2 text-lg">
            <Settings2 size={20} className="text-neon-cyan" />
            <span className="text-neon-cyan">BASIC</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Knob
              label="Start Tempo"
              value={settings.startBpm}
              onChange={(v) => {
                setSettings({ ...settings, startBpm: v });
                if (!isPlaying) setCurrentBpm(v);
              }}
              unit="BPM"
              min={30} max={250}
            />
            <Knob
              label="Time Signature"
              value={settings.beatsPerBar}
              onChange={(v) => setSettings({ ...settings, beatsPerBar: v })}
              min={1} max={12}
            />
          </div>
        </div>

        {/* Accelerando Trainer */}
        <div className="glass-card p-6 border-purple-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
          <h3 className="text-purple-300 font-bold mb-5 flex items-center gap-2 text-lg relative z-10">
            <RefreshCw size={20} className="text-neon-purple" />
            <span className="text-neon-purple">TRAINER</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            <Knob
              label="Increase By"
              value={settings.increaseAmount}
              onChange={(v) => setSettings({ ...settings, increaseAmount: v })}
              min={0} max={10} unit="BPM"
            />
            <Knob
              label="Every N Bars"
              value={settings.increaseIntervalBars}
              onChange={(v) => setSettings({ ...settings, increaseIntervalBars: v })}
              min={1} max={32}
            />
            <div className="sm:col-span-2">
              <Knob
                label="Max Speed"
                value={settings.maxBpm}
                onChange={(v) => setSettings({ ...settings, maxBpm: v })}
                min={settings.startBpm} max={300} unit="BPM"
              />
            </div>
          </div>
          <p className="text-xs text-purple-200/60 mt-4 relative z-10">
            {settings.increaseAmount > 0
              ? `+${settings.increaseAmount} BPM every ${settings.increaseIntervalBars} bars`
              : "Trainer disabled"}
          </p>
        </div>
      </div>

      {/* AI Coach Section Removed */}

      <footer className="mt-16 text-slate-600 text-xs relative z-10">
        <span className="text-cyan-500/50">⚡</span> {new Date().getFullYear()} ACCELERANDO <span className="text-cyan-500/50">⚡</span>
      </footer>
    </div>
  );
};



export default App;
